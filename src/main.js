const apiURL = "http://localhost:5000/students";
const stateAPI = "https://cdn.jsdelivr.net/npm/country-state-city@1.0.0/lib/state.json";

document.addEventListener("DOMContentLoaded", () => {
  loadStates();
  fetchStudents();
});

// Load States dynamically
async function loadStates() {
  const stateDropdown = document.getElementById("state");
  const res = await fetch(stateAPI);
  const states = await res.json();

  stateDropdown.innerHTML = `<option value="">Select State</option>`;
  states
    .filter(s => s.country_id === "101") // India
    .forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.name;
      opt.textContent = s.name;
      stateDropdown.appendChild(opt);
    });
}

// Add or Update Student
let editingId = null;

const submitBtn = document.getElementById("submitBtn");
submitBtn.addEventListener("click", async () => {
  const student = {
    name: document.getElementById("name").value,
    dob: document.getElementById("dob").value,
    gender: document.getElementById("gender").value,
    state: document.getElementById("state").value,
    city: document.getElementById("city").value,
    pincode: document.getElementById("pincode").value
  };

  if (editingId) {
    await fetch(`${apiURL}/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(student)
    });
    editingId = null;
    submitBtn.textContent = "Add Student";
  } else {
    await fetch(apiURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(student)
    });
  }

  clearForm();
  fetchStudents();
});

// Fetch & Display Students
async function fetchStudents() {
  const res = await fetch(apiURL);
  const students = await res.json();
  const container = document.getElementById("studentList");

  container.innerHTML = "";
  students.forEach(s => {
    const card = document.createElement("div");
    card.className = "student-card";
    card.innerHTML = `
      <div><span>Name:</span> ${s.name}</div>
      <div><span>DOB:</span> ${s.dob}</div>
      <div><span>Gender:</span> ${s.gender}</div>
      <div><span>State:</span> ${s.state}</div>
      <div><span>City:</span> ${s.city}</div>
      <div><span>Pincode:</span> ${s.pincode}</div>
      <div class="actions">
        <button class="edit-btn" onclick="editStudent(${s.id})">Edit</button>
        <button class="delete-btn" onclick="deleteStudent(${s.id})">Delete</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Edit Student
window.editStudent = async (id) => {
  const students = await fetch(apiURL).then(r => r.json());
  const student = students.find(s => s.id === id);

  document.getElementById("name").value = student.name;
  document.getElementById("dob").value = student.dob;
  document.getElementById("gender").value = student.gender;
  document.getElementById("state").value = student.state;
  document.getElementById("city").value = student.city;
  document.getElementById("pincode").value = student.pincode;

  editingId = id;
  submitBtn.textContent = "Update Student";
};

// Delete Student
window.deleteStudent = async (id) => {
  await fetch(`${apiURL}/${id}`, { method: "DELETE" });
  fetchStudents();
};

// Clear Form
function clearForm() {
  document.getElementById("name").value = "";
  document.getElementById("dob").value = "";
  document.getElementById("gender").value = "";
  document.getElementById("state").value = "";
  document.getElementById("city").value = "";
  document.getElementById("pincode").value = "";
}
