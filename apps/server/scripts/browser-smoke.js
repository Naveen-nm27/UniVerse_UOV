import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import express from "express";
import jwt from "jsonwebtoken";
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
// The browser proxy permits reads only; its API runs against the caller's isolated test fixture.
export async function runBrowserChecks(apiOrigin, credentialVersion) {
  const contextDir = await fs.mkdtemp(path.join(os.tmpdir(), "universe-browser-"));
  let edge,
    socket,
    web,
    injection,
    id = 0,
    outage = false;
  const pending = new Map(),
    pageErrors = [];
  try {
    const site = express(),
      dist = fileURLToPath(new URL("../../client/dist/", import.meta.url));
    site.use("/api", async (req, res) => {
      if (!["GET", "OPTIONS"].includes(req.method)) return res.sendStatus(405);
      if (outage && req.originalUrl.startsWith("/api/lecturer/"))
        return res.status(503).json({ error: { message: "Test service unavailable" } });
      try {
        const upstream = await fetch(apiOrigin + req.originalUrl, {
          headers: { Authorization: req.headers.authorization || "" },
        });
        res
          .status(upstream.status)
          .type(upstream.headers.get("content-type") || "application/json")
          .send(Buffer.from(await upstream.arrayBuffer()));
      } catch {
        res.status(503).json({ error: { message: "Test service unavailable" } });
      }
    });
    site.use(express.static(dist));
    site.get("/{*route}", (req, res) => res.sendFile(path.join(dist, "index.html")));
    web = site.listen(0, "127.0.0.1");
    await new Promise((r) => web.once("listening", r));
    const origin = `http://127.0.0.1:${web.address().port}`;
    edge = spawn(
      process.env.EDGE_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
      [
        "--headless",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--remote-debugging-port=0",
        `--user-data-dir=${contextDir}`,
        "about:blank",
      ],
      { windowsHide: true, stdio: "ignore" },
    );
    let spawnError;
    edge.on("error", (e) => {
      spawnError = e;
    });
    let port;
    for (let n = 0; n < 150; n++) {
      if (spawnError) throw spawnError;
      try {
        port = (await fs.readFile(path.join(contextDir, "DevToolsActivePort"), "utf8")).split(
          "\n",
        )[0];
        break;
      } catch {
        await delay(100);
      }
    }
    assert.ok(port, "Headless Edge did not start. Configure EDGE_PATH.");
    const target = await (
      await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })
    ).json();
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r, j) => {
      socket.addEventListener("open", r, { once: true });
      socket.addEventListener("error", j, { once: true });
    });
    socket.addEventListener("message", (event) => {
      const m = JSON.parse(event.data);
      if (m.id) {
        const p = pending.get(m.id);
        pending.delete(m.id);
        if (p) {
          clearTimeout(p.timer);
          m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result);
        }
      }
      if (m.method === "Runtime.exceptionThrown") pageErrors.push(m.params.exceptionDetails.text);
    });
    function command(method, params = {}) {
      return new Promise((resolve, reject) => {
        const key = ++id,
          timer = setTimeout(() => {
            pending.delete(key);
            reject(new Error(`Browser command timed out: ${method}`));
          }, 15000);
        pending.set(key, { resolve, reject, timer });
        socket.send(JSON.stringify({ id: key, method, params }));
      });
    }
    async function evaluate(expression) {
      const r = await command("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
      return r.result.value;
    }
    await command("Page.enable");
    await command("Runtime.enable");
    await command("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    async function actor(userId, role) {
      if (injection)
        await command("Page.removeScriptToEvaluateOnNewDocument", { identifier: injection });
      const session = {
        token: jwt.sign({ credentialVersion }, process.env.JWT_SECRET, {
          subject: String(userId),
          expiresIn: "10m",
        }),
        user: { id: userId, role, fullName: `${role} ${userId}`, mustChangePassword: false },
      };
      const source = `localStorage.setItem('universe_session',${JSON.stringify(JSON.stringify(session))});sessionStorage.removeItem('universe_session');const originalFetch=window.fetch;window.fetch=(input,options)=>{const url=new URL(typeof input==='string'?input:input.url,location.origin);return originalFetch(url.pathname.startsWith('/api/')?location.origin+url.pathname+url.search:input,options);};`;
      injection = (await command("Page.addScriptToEvaluateOnNewDocument", { source })).identifier;
    }
    async function wait(condition) {
      for (let n = 0; n < 150; n++) {
        if (await evaluate(condition)) return;
        await delay(100);
      }
      throw new Error(
        `Browser view did not load: ${await evaluate('location.pathname+" "+document.body.innerText.slice(0,700)')}`,
      );
    }
    async function page(route, condition) {
      await command("Page.navigate", { url: origin + route });
      await wait(condition);
    }
    await actor(1, "MA");
    await page(
      "/ma",
      "document.querySelectorAll('.ma-card-value').length===4 && document.querySelector('.ma-card-value').textContent!=='—'",
    );
    await page("/ma/users", "document.querySelectorAll('.ma-table tbody tr').length>0");
    await wait("Boolean(document.querySelector('canvas[aria-label=\"Users by role\"]'))");
    const userTotals = await evaluate(
      "[...document.querySelectorAll('.ma-user-totals .ma-card-value')].map(node=>node.textContent)",
    );
    await evaluate(
      "{ const select=document.querySelector('select[name=roleFilter]');select.value='LECTURER';select.dispatchEvent(new Event('change',{bubbles:true})); }",
    );
    await wait(
      "document.querySelectorAll('.ma-table tbody tr').length>0 && [...document.querySelectorAll('.ma-table tbody tr')].every(row=>row.cells[2].textContent==='LECTURER')",
    );
    await evaluate(
      "{ const select=document.querySelector('select[name=statusFilter]');select.value='inactive';select.dispatchEvent(new Event('change',{bubbles:true})); }",
    );
    await wait("document.body.innerText.includes('No users match these filters.')");
    assert.deepEqual(
      await evaluate(
        "[...document.querySelectorAll('.ma-user-totals .ma-card-value')].map(node=>node.textContent)",
      ),
      userTotals,
    );
    await evaluate(
      "[...document.querySelectorAll('.ma-toolbar button')].find(button=>button.textContent==='Clear filters').click()",
    );
    await wait(
      "document.querySelectorAll('.ma-table tbody tr').length>0 && document.querySelector('select[name=roleFilter]').value===''",
    );
    await command("Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 812,
      deviceScaleFactor: 1,
      mobile: true,
    });
    assert.ok(await evaluate("document.documentElement.scrollWidth<=window.innerWidth"));
    assert.ok(await evaluate("document.querySelector('canvas').getBoundingClientRect().width>0"));
    await command("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await evaluate("document.querySelector('.ma-welcome button').click()");
    assert.ok(await evaluate("Boolean(document.querySelector('input[name=registrationNumber]'))"));
    await page(
      "/ma/academic",
      "document.querySelectorAll('.ma-tabs button').length===7 && document.querySelector('.ma-table')!==null",
    );
    await evaluate(
      "[...document.querySelectorAll('.ma-tabs button')].find(b=>b.textContent==='Halls').click()",
    );
    await wait(
      "document.querySelector('.ma-panel h2')?.textContent==='Halls' && document.querySelector('.ma-table tbody')?.textContent.includes('Hall A')",
    );
    await page("/ma/grades", "document.querySelector('select')?.options.length>1");
    await evaluate(
      "document.querySelector('select').value='1';document.querySelector('select').dispatchEvent(new Event('change',{bubbles:true}))",
    );
    await wait("document.querySelector('select[name=enrollmentId]')?.options.length>1");
    await page("/ma/results", "document.querySelectorAll('.ma-table tbody tr').length>0");
    assert.ok(
      await evaluate(
        "parseFloat(getComputedStyle(document.querySelector('.ma-field select')).minHeight)>=40 && parseFloat(getComputedStyle(document.querySelector('.ma-field select')).borderRadius)>0",
      ),
    );
    await evaluate("document.querySelector('.ma-table tbody button').click()");
    await wait("document.body.innerText.includes('Status history')");
    assert.ok(
      await evaluate(
        "[...document.querySelectorAll('.ma-content button')].every(button=>parseFloat(getComputedStyle(button).borderRadius)>0)",
      ),
    );
    console.log("Browser: MA accounts, academic resources, grade context and workflow rendered.");
    await actor(7, "STUDENT");
    await page("/student", "document.querySelectorAll('.student-subject-result').length>0");
    assert.equal(await evaluate("document.querySelector('#assessments')"), null);
    assert.equal(
      await evaluate("document.body.innerText.includes('Results by study year')"),
      false,
    );
    assert.ok(await evaluate("document.querySelectorAll('.student-subject-result').length>0"));
    assert.equal(
      await evaluate(
        "document.querySelector('.student-subject-result').querySelectorAll('.student-subject-icas dt').length",
      ),
      3,
    );
    assert.equal(
      await evaluate("document.querySelectorAll('.student-subject-list details').length"),
      0,
    );
    await evaluate(
      "document.querySelector('.student-subject-result button').focus(); document.querySelector('.student-subject-result button').click()",
    );
    await wait("Boolean(document.querySelector('.student-subject-dialog[open] canvas'))");
    assert.ok(
      await evaluate(
        "document.querySelector('.student-subject-dialog canvas').getBoundingClientRect().width>0",
      ),
    );
    await command("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
    await wait("!document.querySelector('.student-subject-dialog')");
    assert.ok(
      await evaluate(
        "document.activeElement===document.querySelector('.student-subject-result button')",
      ),
    );
    await command("Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 812,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await evaluate("document.querySelector('.student-subject-result button').click()");
    await wait("Boolean(document.querySelector('.student-subject-dialog[open] canvas'))");
    assert.ok(
      await evaluate(
        "document.querySelector('.student-subject-dialog').getBoundingClientRect().right<=window.innerWidth",
      ),
    );
    await evaluate("document.querySelector('.student-subject-dialog button').click()");
    await wait("!document.querySelector('.student-subject-dialog')");
    await command("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await evaluate(
      "document.querySelector('.student-semester select').value='1';document.querySelector('.student-semester select').dispatchEvent(new Event('change',{bubbles:true}))",
    );
    await wait(
      "document.querySelectorAll('#results .student-subject-result').length>0 && document.querySelector('.student-semester select').value==='1'",
    );
    await page("/ma", "document.body.innerText.includes('Workspace unavailable')");
    console.log(
      "Browser: combined subject cards, semester selection, graph dialog and role denial rendered.",
    );
    await actor(2, "LECTURER");
    await page("/lecturer", "document.querySelectorAll('.ma-card-value').length===3");
    await page("/lecturer/modules", "document.querySelectorAll('.ma-table tbody tr').length===2");
    await page(
      "/lecturer/modules/1",
      "document.querySelector('.ma-table tbody')?.textContent.includes('2026/ICT/7')",
    );
    await page("/lecturer/sessions/1", "document.body.innerText.includes('notRecorded: 1')");
    await page("/lecturer/results", "document.querySelectorAll('.ma-table tbody tr').length>0");
    for (const [userId, role] of [
      [4, "HOD"],
      [5, "DEAN"],
      [6, "ADMIN"],
    ]) {
      await actor(userId, role);
      await page(`/${role.toLowerCase()}`, "document.querySelector('.ma-table tbody')!==null");
      if (["HOD", "DEAN"].includes(role)) {
        await wait("document.querySelectorAll('.staff-university-summary canvas').length===2");
        const summary = await evaluate(
          "fetch('/api/staff/dashboard',{headers:{Authorization:'Bearer '+JSON.parse(localStorage.getItem('universe_session')).token}}).then(response=>response.json()).then(body=>body.data.universitySummary)",
        );
        assert.deepEqual(
          await evaluate(
            "[...document.querySelectorAll('.staff-summary-cards .ma-card-value')].map(node=>Number(node.textContent.replaceAll(',','')))",
          ),
          [summary.users.total, summary.devices.total, summary.halls.total],
        );
        assert.deepEqual(
          await evaluate(
            "[...document.querySelectorAll('.staff-hall-summary dd')].map(node=>Number(node.textContent.replaceAll(',','')))",
          ),
          [
            summary.halls.withDevices,
            summary.halls.withoutDevices,
            summary.halls.knownCapacity,
            summary.halls.unknownCapacity,
          ],
        );
        await command("Emulation.setDeviceMetricsOverride", {
          width: 375,
          height: 812,
          deviceScaleFactor: 1,
          mobile: true,
        });
        assert.ok(await evaluate("document.documentElement.scrollWidth<=window.innerWidth"));
        assert.ok(
          await evaluate(
            "[...document.querySelectorAll('.staff-university-summary canvas')].every(canvas=>canvas.getBoundingClientRect().width>0)",
          ),
        );
        await command("Emulation.setDeviceMetricsOverride", {
          width: 1280,
          height: 900,
          deviceScaleFactor: 1,
          mobile: false,
        });
      }
      await page(
        role === "ADMIN" ? "/admin/audit" : `/${role.toLowerCase()}/results`,
        "document.querySelectorAll('.ma-table tbody tr').length>0",
      );
    }
    console.log("Browser: lecturer, HOD, dean and administrator workspaces rendered.");
    await actor(2, "LECTURER");
    outage = true;
    await page("/lecturer/modules", "document.body.innerText.includes('Test service unavailable')");
    assert.equal(await evaluate("document.querySelectorAll('.ma-table tbody tr').length"), 0);
    outage = false;
    await command("Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 812,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await page("/lecturer/modules", "document.querySelector('.ma-table tbody')!==null");
    assert.ok(await evaluate("document.documentElement.scrollWidth<=window.innerWidth"));
    await evaluate("document.querySelector('.ma-menu-button').click()");
    assert.ok(
      await evaluate("document.querySelector('.ma-sidebar').classList.contains('is-open')"),
    );
    await command("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
    await delay(100);
    assert.equal(
      await evaluate("document.querySelector('.ma-sidebar').classList.contains('is-open')"),
      false,
    );
    assert.deepEqual(pageErrors, []);
    console.log(
      "Browser: API errors, mobile layout and keyboard dismissal passed; no JavaScript exceptions.",
    );
  } finally {
    if (socket?.readyState === 1) {
      socket.send(JSON.stringify({ id: 99999, method: "Browser.close" }));
      await delay(300);
      socket.close();
    }
    for (const p of pending.values()) {
      clearTimeout(p.timer);
      p.reject(new Error("Browser checks ended"));
    }
    pending.clear();
    if (edge && !edge.killed) edge.kill();
    if (web) await new Promise((r) => web.close(r));
    const resolved = path.resolve(contextDir);
    if (
      path.dirname(resolved) !== path.resolve(os.tmpdir()) ||
      !path.basename(resolved).startsWith("universe-browser-")
    )
      throw new Error("Unexpected browser cleanup path");
    await fs.rm(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}
