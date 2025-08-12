// server.js
import express from "express";
const app = express();

app.get("/", (req, res) => res.json({ ok: true }));

const port = 8080; // <-- important
app.listen(port, () => console.log("listening on test", port));
