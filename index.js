import express from "express";
const app = express();

app.get("/", (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 8080;   // use Cloud Run's port
const host = "0.0.0.0";                  // bind all interfaces
app.listen(port, host, () => console.log("listening on", host, port));
