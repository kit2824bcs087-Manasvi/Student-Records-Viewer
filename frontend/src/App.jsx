import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/students";

function App() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [year, setYear] = useState("All");
  const [sortBy, setSortBy] = useState("default");

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [darkMode, setDarkMode] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const studentsPerPage = 5;

  const [formData, setFormData] = useState({
    name: "",
    department: "",
    year: "1",
    email: "",
    cgpa: "",
  });

  // Fetch students
  const fetchStudents = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const data = await response.json();

      setStudents(data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Clear notification
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

  // Departments
  const departments = useMemo(() => {
    return [...new Set(students.map((student) => student.department))];
  }, [students]);

  // Filter + search + sort
  const filteredStudents = useMemo(() => {
    let result = students.filter((student) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        student.name.toLowerCase().includes(searchText) ||
        student.department.toLowerCase().includes(searchText) ||
        student.email.toLowerCase().includes(searchText);

      const matchesDepartment =
        department === "All" ||
        student.department === department;

      const matchesYear =
        year === "All" ||
        String(student.year) === String(year);

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesYear
      );
    });

    if (sortBy === "nameAsc") {
      result.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }

    if (sortBy === "nameDesc") {
      result.sort((a, b) =>
        b.name.localeCompare(a.name)
      );
    }

    if (sortBy === "cgpaHigh") {
      result.sort((a, b) => b.cgpa - a.cgpa);
    }

    if (sortBy === "cgpaLow") {
      result.sort((a, b) => a.cgpa - b.cgpa);
    }

    if (sortBy === "yearAsc") {
      result.sort((a, b) => a.year - b.year);
    }

    if (sortBy === "yearDesc") {
      result.sort((a, b) => b.year - a.year);
    }

    return result;
  }, [students, search, department, year, sortBy]);

  // Pagination
  const totalPages = Math.ceil(
    filteredStudents.length / studentsPerPage
  );

  const startIndex =
    (currentPage - 1) * studentsPerPage;

  const currentStudents = filteredStudents.slice(
    startIndex,
    startIndex + studentsPerPage
  );

  // Statistics
  const averageCGPA =
    students.length > 0
      ? (
          students.reduce(
            (sum, student) => sum + Number(student.cgpa),
            0
          ) / students.length
        ).toFixed(2)
      : "0.00";

  const topStudent =
    students.length > 0
      ? [...students].sort((a, b) => b.cgpa - a.cgpa)[0]
      : null;

  // Form change
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      department: "",
      year: "1",
      email: "",
      cgpa: "",
    });

    setEditingStudent(null);
    setShowForm(false);
  };

  // Add / Edit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const method = editingStudent ? "PUT" : "POST";

      const url = editingStudent
        ? `${API_URL}/${editingStudent.id}`
        : API_URL;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Operation failed");
      }

      await fetchStudents();

      setMessage(
        editingStudent
          ? "Student updated successfully!"
          : "Student added successfully!"
      );

      resetForm();
    } catch (err) {
      setMessage(err.message);
    }
  };

  // Edit
  const handleEdit = (student) => {
    setEditingStudent(student);

    setFormData({
      name: student.name,
      department: student.department,
      year: String(student.year),
      email: student.email,
      cgpa: String(student.cgpa),
    });

    setShowForm(true);
    setSelectedStudent(null);
  };

  // Delete
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this student?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Delete failed");
      }

      await fetchStudents();

      setMessage("Student deleted successfully!");
      setSelectedStudent(null);
    } catch (err) {
      setMessage(err.message);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearch("");
    setDepartment("All");
    setYear("All");
    setSortBy("default");
    setCurrentPage(1);
  };

  // Page change
  const changePage = (page) => {
    setCurrentPage(page);
  };

  // Search/filter page reset
  useEffect(() => {
    setCurrentPage(1);
  }, [search, department, year, sortBy]);

  return (
    <div className={darkMode ? "app dark" : "app"}>
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">
          🎓 Student Records
        </div>

        <div className="nav-actions">
          <button
            onClick={() => setShowAnalytics(false)}
            className="nav-button"
          >
            Students
          </button>

          <button
            onClick={() => setShowAnalytics(true)}
            className="nav-button"
          >
            Analytics
          </button>

          <button
            className="theme-button"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </nav>

      {/* HEADER */}
      <header className="header">
        <h1>Student Records Viewer</h1>
        <p>
          Manage, search, filter and analyze student records
        </p>
      </header>

      <main className="container">
        {/* NOTIFICATION */}
        {message && (
          <div className="toast">
            {message}
          </div>
        )}

        {/* ANALYTICS */}
        {showAnalytics ? (
          <section className="analytics-page">
            <div className="section-heading">
              <div>
                <h2>Student Analytics</h2>
                <p>
                  Overview of academic performance and
                  department distribution
                </p>
              </div>
            </div>

            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>Total Students</h3>
                <strong>{students.length}</strong>
              </div>

              <div className="analytics-card">
                <h3>Departments</h3>
                <strong>{departments.length}</strong>
              </div>

              <div className="analytics-card">
                <h3>Average CGPA</h3>
                <strong>{averageCGPA}</strong>
              </div>

              <div className="analytics-card">
                <h3>Top Student</h3>
                <strong>
                  {topStudent
                    ? topStudent.name
                    : "N/A"}
                </strong>
              </div>
            </div>

            <div className="chart-card">
              <h2>Department Distribution</h2>

              {departments.map((dept) => {
                const count = students.filter(
                  (student) =>
                    student.department === dept
                ).length;

                const percentage =
                  students.length > 0
                    ? (count / students.length) * 100
                    : 0;

                return (
                  <div
                    className="chart-row"
                    key={dept}
                  >
                    <div className="chart-label">
                      <span>{dept}</span>
                      <strong>{count}</strong>
                    </div>

                    <div className="bar-background">
                      <div
                        className="bar"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="chart-card">
              <h2>CGPA Performance</h2>

              {students
                .slice()
                .sort((a, b) => b.cgpa - a.cgpa)
                .map((student) => {
                  const percentage =
                    (student.cgpa / 10) * 100;

                  return (
                    <div
                      className="chart-row"
                      key={student.id}
                    >
                      <div className="chart-label">
                        <span>{student.name}</span>
                        <strong>
                          {student.cgpa}
                        </strong>
                      </div>

                      <div className="bar-background">
                        <div
                          className="bar cgpa-bar"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        ) : (
          <>
            {/* STATISTICS */}
            <div className="stats">
              <div className="stat-card">
                <span>👨‍🎓</span>
                <h3>Total Students</h3>
                <p>{students.length}</p>
              </div>

              <div className="stat-card">
                <span>🏫</span>
                <h3>Departments</h3>
                <p>{departments.length}</p>
              </div>

              <div className="stat-card">
                <span>📈</span>
                <h3>Average CGPA</h3>
                <p>{averageCGPA}</p>
              </div>

              <div className="stat-card">
                <span>🏆</span>
                <h3>Top CGPA</h3>
                <p>
                  {topStudent
                    ? topStudent.cgpa
                    : "0"}
                </p>
              </div>
            </div>

            {/* TOOLBAR */}
            <div className="toolbar">
              <input
                type="text"
                placeholder="Search name, department or email..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

              <select
                value={department}
                onChange={(e) =>
                  setDepartment(e.target.value)
                }
              >
                <option value="All">
                  All Departments
                </option>

                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) =>
                  setYear(e.target.value)
                }
              >
                <option value="All">
                  All Years
                </option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value)
                }
              >
                <option value="default">
                  Sort By
                </option>
                <option value="nameAsc">
                  Name A-Z
                </option>
                <option value="nameDesc">
                  Name Z-A
                </option>
                <option value="cgpaHigh">
                  Highest CGPA
                </option>
                <option value="cgpaLow">
                  Lowest CGPA
                </option>
                <option value="yearAsc">
                  Year Low-High
                </option>
                <option value="yearDesc">
                  Year High-Low
                </option>
              </select>

              <button
                className="reset-button"
                onClick={resetFilters}
              >
                Reset
              </button>
            </div>

            {/* ADD STUDENT */}
            <div className="action-row">
              <button
                className="primary-button"
                onClick={() => {
                  setEditingStudent(null);
                  setFormData({
                    name: "",
                    department: "",
                    year: "1",
                    email: "",
                    cgpa: "",
                  });
                  setShowForm(true);
                }}
              >
                + Add Student
              </button>

              <span>
                Showing {filteredStudents.length} student
                {filteredStudents.length !== 1
                  ? "s"
                  : ""}
              </span>
            </div>

            {/* FORM */}
            {showForm && (
              <div className="form-card">
                <div className="form-header">
                  <h2>
                    {editingStudent
                      ? "Edit Student"
                      : "Add Student"}
                  </h2>

                  <button
                    className="close-button"
                    onClick={resetForm}
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-grid">
                    <input
                      type="text"
                      name="name"
                      placeholder="Student Name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />

                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">
                        Select Department
                      </option>

                      <option value="Computer Science and Engineering">
                        Computer Science and Engineering
                      </option>

                      <option value="Information Technology">
                        Information Technology
                      </option>

                      <option value="Electronics and Communication Engineering">
                        Electronics and Communication Engineering
                      </option>
                    </select>

                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="1">
                        Year 1
                      </option>
                      <option value="2">
                        Year 2
                      </option>
                      <option value="3">
                        Year 3
                      </option>
                      <option value="4">
                        Year 4
                      </option>
                    </select>

                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />

                    <input
                      type="number"
                      name="cgpa"
                      placeholder="CGPA"
                      min="0"
                      max="10"
                      step="0.1"
                      value={formData.cgpa}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="primary-button"
                    >
                      {editingStudent
                        ? "Update Student"
                        : "Add Student"}
                    </button>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TABLE */}
            {loading ? (
              <div className="loading">
                <div className="spinner" />
                Loading student records...
              </div>
            ) : error ? (
              <div className="error-box">
                <h3>⚠️ Connection Error</h3>
                <p>{error}</p>

                <button
                  className="primary-button"
                  onClick={fetchStudents}
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Student</th>
                      <th>Department</th>
                      <th>Year</th>
                      <th>Email</th>
                      <th>CGPA</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentStudents.length > 0 ? (
                      currentStudents.map((student) => (
                        <tr key={student.id}>
                          <td>{student.id}</td>

                          <td>
                            <div className="student-name">
                              <div className="avatar">
                                {student.name
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <span>
                                {student.name}
                              </span>
                            </div>
                          </td>

                          <td>{student.department}</td>

                          <td>
                            <span className="year-badge">
                              Year {student.year}
                            </span>
                          </td>

                          <td>{student.email}</td>

                          <td>
                            <span
                              className={
                                student.cgpa >= 9
                                  ? "cgpa excellent"
                                  : student.cgpa >= 8
                                  ? "cgpa good"
                                  : "cgpa average"
                              }
                            >
                              {student.cgpa}
                            </span>
                          </td>

                          <td>
                            <div className="table-actions">
                              <button
                                className="view-button"
                                onClick={() =>
                                  setSelectedStudent(
                                    student
                                  )
                                }
                              >
                                View
                              </button>

                              <button
                                className="edit-button"
                                onClick={() =>
                                  handleEdit(student)
                                }
                              >
                                Edit
                              </button>

                              <button
                                className="delete-button"
                                onClick={() =>
                                  handleDelete(
                                    student.id
                                  )
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="7"
                          className="no-data"
                        >
                          No students found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={currentPage === 1}
                  onClick={() =>
                    changePage(currentPage - 1)
                  }
                >
                  Previous
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((page) => (
                  <button
                    key={page}
                    className={
                      currentPage === page
                        ? "active-page"
                        : ""
                    }
                    onClick={() =>
                      changePage(page)
                    }
                  >
                    {page}
                  </button>
                ))}

                <button
                  disabled={
                    currentPage === totalPages
                  }
                  onClick={() =>
                    changePage(currentPage + 1)
                  }
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* STUDENT DETAILS MODAL */}
      {selectedStudent && (
        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedStudent(null)
          }
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Student Details</h2>

              <button
                className="close-button"
                onClick={() =>
                  setSelectedStudent(null)
                }
              >
                ×
              </button>
            </div>

            <div className="profile">
              <div className="large-avatar">
                {selectedStudent.name
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <h2>{selectedStudent.name}</h2>
              <p>{selectedStudent.department}</p>
            </div>

            <div className="detail-grid">
              <div>
                <span>ID</span>
                <strong>{selectedStudent.id}</strong>
              </div>

              <div>
                <span>Year</span>
                <strong>
                  Year {selectedStudent.year}
                </strong>
              </div>

              <div>
                <span>Email</span>
                <strong>
                  {selectedStudent.email}
                </strong>
              </div>

              <div>
                <span>CGPA</span>
                <strong>
                  {selectedStudent.cgpa}
                </strong>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="edit-button large-button"
                onClick={() =>
                  handleEdit(selectedStudent)
                }
              >
                Edit Student
              </button>

              <button
                className="delete-button large-button"
                onClick={() =>
                  handleDelete(selectedStudent.id)
                }
              >
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}

      <footer>
        <p>
          Student Records Viewer • Modern Web Programming
        </p>
      </footer>
    </div>
  );
}

export default App;