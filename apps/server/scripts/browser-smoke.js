import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import express from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../src/data-source.js';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
let api, web, edge, socket, contextDir;
const originalGetRepository=AppDataSource.getRepository;
let apiOrigin;
const fakeMa={userId:4294967294,name:'Browser Test MA',email:'browser-ma@example.com',roleCode:'MA',isActive:true,mustChangePassword:false};
try {
 await AppDataSource.initialize();
 AppDataSource.getRepository=function(name){const repo=originalGetRepository.call(this,name);if(name!=='User')return repo;return new Proxy(repo,{get(target,key){if(key==='findOneBy')return async where=>Number(where.userId)===fakeMa.userId?fakeMa:target.findOneBy(where);const v=target[key];return typeof v==='function'?v.bind(target):v;}});};
 const site=express();const dist=fileURLToPath(new URL('../../client/dist',import.meta.url));
 site.get('/assets/{*file}',(req,res,next)=>{if(!req.path.endsWith('.js'))return next();const target=path.resolve(dist,'.'+req.path);if(!target.startsWith(dist+path.sep))return res.sendStatus(404);res.type('application/javascript').send(fs.readFileSync(target,'utf8').replaceAll('http://localhost:4000/api',apiOrigin+'/api'));});
 site.use(express.static(dist));site.get('/{*route}',(req,res)=>res.sendFile(path.join(dist,'index.html')));
 web=site.listen(0,'127.0.0.1');await new Promise(r=>web.once('listening',r));const siteOrigin=`http://127.0.0.1:${web.address().port}`;
 process.env.FRONTEND_URL=siteOrigin;
 const {default:app}=await import('../src/app.js');
 const readOnly=express();readOnly.use((req,res,next)=>['GET','OPTIONS'].includes(req.method)?next():res.sendStatus(405));readOnly.use(app);
 api=readOnly.listen(0,'127.0.0.1');await new Promise(r=>api.once('listening',r));apiOrigin=`http://127.0.0.1:${api.address().port}`;
 contextDir=fs.mkdtempSync(path.join(os.tmpdir(),'universe-browser-'));
 edge=spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${contextDir}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
 const portFile=path.join(contextDir,'DevToolsActivePort');for(let i=0;i<100&&!fs.existsSync(portFile);i++)await delay(100);assert.ok(fs.existsSync(portFile),'Edge did not expose its local debug port');
 const port=fs.readFileSync(portFile,'utf8').split('\n')[0];const target=await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json();
 socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true});});
 let id=0;const pending=new Map();const pageErrors=[];
 socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id){const p=pending.get(message.id);pending.delete(message.id);if(!p)return;if(message.error)p.reject(new Error(message.error.message));else p.resolve(message.result);}if(message.method==='Runtime.exceptionThrown')pageErrors.push(message.params.exceptionDetails.text);});
 function command(method,params={}){return new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}));});}
 async function evaluate(expression){const r=await command('Runtime.evaluate',{expression:`(() => { const value = (${expression}); return value !== null && typeof value === "object" ? Boolean(value) : value; })()`,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value;}
 await command('Page.enable');await command('Runtime.enable');await command('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 let injection;
 async function actor(user){if(injection)await command('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection});const token=jwt.sign({},process.env.JWT_SECRET,{subject:String(user.id),expiresIn:'5m'});const session={token,user};const source=`localStorage.setItem('universe_session',${JSON.stringify(JSON.stringify(session))});sessionStorage.removeItem('universe_session');`;injection=(await command('Page.addScriptToEvaluateOnNewDocument',{source})).identifier;}
 async function page(route,condition){await command('Page.navigate',{url:siteOrigin+route});for(let i=0;i<100;i++){if(await evaluate(condition))return;await delay(100);}throw new Error(`Browser page did not reach expected state: ${route}`);}
 await actor({id:fakeMa.userId,role:'MA',fullName:fakeMa.name,mustChangePassword:false});
 await page('/ma',"document.querySelectorAll('.ma-card-value').length===4 && document.querySelector('.ma-card-value').textContent!=='\u2014'");assert.ok(await evaluate("document.querySelector('.ma-profile')?.textContent.includes('Browser Test MA')"));console.log('MA overview: real counts and authenticated profile rendered');
 await page('/ma/users',"document.querySelectorAll('.ma-table tbody tr').length>0");console.log('MA users: canonical accounts table rendered');
 await evaluate("document.querySelector('.ma-welcome button').click()");for(let i=0;i<30;i++){if(await evaluate("document.querySelector('select[name=programmeId]')?.options.length>1"))break;await delay(100);}assert.ok(await evaluate("document.querySelector('input[name=registrationNumber]') && document.querySelector('select[name=programmeId]').options.length>1"));console.log('MA student form: integer reference options and profile inputs rendered');
 await page('/ma/academic',"document.querySelectorAll('.ma-tabs button').length===7 && document.querySelector('.ma-table')");await evaluate("document.querySelector('.ma-panel-heading button').click()");assert.ok(await evaluate("document.querySelector('.ma-form input[type=text]')"));console.log('MA academic setup: database records and edit/create form rendered');
 await evaluate("[...document.querySelectorAll('.ma-tabs button')].find(b=>b.textContent==='Halls').click()");assert.ok(await evaluate("document.body.innerText.includes('complete academic database schema')"));console.log('Unavailable academic resource: explicit setup state rendered');
 const [student]=await AppDataSource.query("SELECT user_id AS id FROM USERS WHERE role_code='STUDENT' AND is_active=1 AND must_change_password=0 LIMIT 1");
 await actor({id:student.id,role:'STUDENT',fullName:'Browser Test Student',mustChangePassword:false});
 await page('/student',"document.querySelectorAll('.student-result-subject').length>0");assert.ok(await evaluate("document.querySelectorAll('.student-summary article').length===4"));console.log('Student dashboard: published results and summary rendered');
 await evaluate("document.querySelector('.student-result-subject-heading').click()");for(let i=0;i<100;i++){if(await evaluate("document.querySelector('.student-attempt-card')"))break;await delay(100);}assert.ok(await evaluate("document.querySelector('.student-attempt-card')"));console.log('Student result details: protected published attempt history rendered');
 await page('/ma',"document.body.innerText.includes('Workspace unavailable')");console.log('Frontend role guard: student cannot open MA workspace');
 fakeMa.mustChangePassword=true;await actor({id:fakeMa.userId,role:'MA',fullName:fakeMa.name,mustChangePassword:true});
 await page('/ma',"document.querySelector('input[name=currentPassword]')");console.log('Temporary password: password change form rendered');
 assert.deepEqual(pageErrors,[]);console.log('Browser smoke checks passed without database writes or JavaScript exceptions.');
} catch(error){console.error(error.message);process.exitCode=1;}
finally {
 if(socket?.readyState===1){socket.send(JSON.stringify({id:99999,method:'Browser.close'}));await delay(500);socket.close();}
 if(edge&&!edge.killed)edge.kill();
 if(api)await new Promise(r=>api.close(r));if(web)await new Promise(r=>web.close(r));
 AppDataSource.getRepository=originalGetRepository;if(AppDataSource.isInitialized)await AppDataSource.destroy();
 if(contextDir){const resolved=path.resolve(contextDir);const tempRoot=path.resolve(os.tmpdir());if(!resolved.startsWith(tempRoot+path.sep)||!path.basename(resolved).startsWith('universe-browser-'))throw new Error('Unexpected browser cleanup path');try{fs.rmSync(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:100});}catch{console.log('Browser cache directory remains in the system temporary directory.');}} 
}
