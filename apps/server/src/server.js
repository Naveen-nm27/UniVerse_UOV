import express from "express"

const app = express()
app.use(express.json());

app.get("/health",(_req,res) => res.json({statu:"ok"}));

const PORT = process.env.PORT || 4000;
app.listen(PORT,()=> console.log(`Server is Running on ${PORT}`));