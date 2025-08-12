import express from "express";
const app = express();

// Add basic middleware
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 8080;
const host = "0.0.0.0";

const server = app.listen(port, host, () => {
  console.log(`Server listening on ${host}:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});