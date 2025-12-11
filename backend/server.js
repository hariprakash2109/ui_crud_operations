import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = "./db.json";

// Read DB
function readDB() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ students: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

// Write DB
function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// GET all students
app.get("/students", (req, res) => {
  const db = readDB();
  res.json(db.students);
});

// CREATE student
app.post("/students", (req, res) => {
  const db = readDB();
  const newStudent = { id: Date.now(), ...req.body };
  db.students.push(newStudent);
  writeDB(db);
  res.json(newStudent);
});

// UPDATE student
app.put("/students/:id", (req, res) => {
  const db = readDB();
  const id = Number(req.params.id);
  db.students = db.students.map(s => s.id === id ? { ...s, ...req.body } : s);
  writeDB(db);
  res.json({ success: true });
});

// DELETE student
app.delete("/students/:id", (req, res) => {
  const db = readDB();
  const id = Number(req.params.id);
  db.students = db.students.filter(s => s.id !== id);
  writeDB(db);
  res.json({ success: true });
});

app.listen(5000, () => console.log("Backend Running → http://localhost:5000"));
