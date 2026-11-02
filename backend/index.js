const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// Database connection, read from environment variables (with local defaults)
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "taskuser",
  password: process.env.DB_PASSWORD || "taskpass",
  database: process.env.DB_NAME || "tasksdb",
});

// Health check: is the API up, and can it reach the database?
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", database: "unreachable" });
  }
});

// READ all tasks
app.get("/tasks", async (req, res) => {
  const result = await pool.query("SELECT * FROM tasks ORDER BY id");
  res.json(result.rows);
});

// CREATE a task
app.post("/tasks", async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "title is required" });
  }
  const result = await pool.query(
    "INSERT INTO tasks (title) VALUES ($1) RETURNING *",
    [title.trim()]
  );
  res.status(201).json(result.rows[0]);
});

// UPDATE a task (mark done / not done, or rename)
app.put("/tasks/:id", async (req, res) => {
  const { title, completed } = req.body;
  const result = await pool.query(
    "UPDATE tasks SET title = COALESCE($1, title), completed = COALESCE($2, completed) WHERE id = $3 RETURNING *",
    [title ?? null, completed ?? null, req.params.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "task not found" });
  }
  res.json(result.rows[0]);
});

// DELETE a task
app.delete("/tasks/:id", async (req, res) => {
  const result = await pool.query("DELETE FROM tasks WHERE id = $1", [req.params.id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ error: "task not found" });
  }
  res.status(204).send();
});

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});