const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const dataFile = path.join(__dirname, "students.json");

// Read students
function readStudents() {
  try {
    const data = fs.readFileSync(dataFile, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Write students
function writeStudents(students) {
  fs.writeFileSync(
    dataFile,
    JSON.stringify(students, null, 2),
    "utf8"
  );
}

// Test route
app.get("/", (req, res) => {
  res.send("Student Records Backend is Running!");
});

// GET all students
app.get("/api/students", (req, res) => {
  const students = readStudents();
  res.json(students);
});

// GET student by ID
app.get("/api/students/:id", (req, res) => {
  const students = readStudents();
  const id = Number(req.params.id);

  const student = students.find((student) => student.id === id);

  if (!student) {
    return res.status(404).json({
      message: "Student not found",
    });
  }

  res.json(student);
});

// ADD student
app.post("/api/students", (req, res) => {
  const students = readStudents();

  const { name, department, year, email, cgpa } = req.body;

  if (!name || !department || !year || !email || cgpa === undefined) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  const emailExists = students.some(
    (student) =>
      student.email.toLowerCase() === email.toLowerCase()
  );

  if (emailExists) {
    return res.status(400).json({
      message: "Email already exists",
    });
  }

  const newId =
    students.length > 0
      ? Math.max(...students.map((student) => student.id)) + 1
      : 1;

  const newStudent = {
    id: newId,
    name: String(name).trim(),
    department: String(department).trim(),
    year: Number(year),
    email: String(email).trim(),
    cgpa: Number(cgpa),
  };

  students.push(newStudent);
  writeStudents(students);

  res.status(201).json(newStudent);
});

// UPDATE student
app.put("/api/students/:id", (req, res) => {
  const students = readStudents();
  const id = Number(req.params.id);

  const index = students.findIndex(
    (student) => student.id === id
  );

  if (index === -1) {
    return res.status(404).json({
      message: "Student not found",
    });
  }

  const { name, department, year, email, cgpa } = req.body;

  if (!name || !department || !year || !email || cgpa === undefined) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  const emailExists = students.some(
    (student) =>
      student.id !== id &&
      student.email.toLowerCase() === email.toLowerCase()
  );

  if (emailExists) {
    return res.status(400).json({
      message: "Email already exists",
    });
  }

  students[index] = {
    id,
    name: String(name).trim(),
    department: String(department).trim(),
    year: Number(year),
    email: String(email).trim(),
    cgpa: Number(cgpa),
  };

  writeStudents(students);

  res.json(students[index]);
});

// DELETE student
app.delete("/api/students/:id", (req, res) => {
  const students = readStudents();
  const id = Number(req.params.id);

  const index = students.findIndex(
    (student) => student.id === id
  );

  if (index === -1) {
    return res.status(404).json({
      message: "Student not found",
    });
  }

  const deletedStudent = students[index];

  students.splice(index, 1);
  writeStudents(students);

  res.json({
    message: "Student deleted successfully",
    student: deletedStudent,
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});