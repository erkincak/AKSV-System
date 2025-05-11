const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Sample endpoint returning mock data
app.get("/api/mock", (req, res) => {
  res.json({
    message: "This is mock data from the backend",
    data: {
      id: 1,
      name: "Sample Item",
      description: "This is a sample description",
    },
  });
});

// In-memory "database"
let items = [];
let nextId = 1;

// Volunteers in-memory store with passwords
let volunteers = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    password: "volunteer1pass",
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob@example.com",
    password: "volunteer2pass",
  },
  {
    id: 3,
    name: "Charlie Brown",
    email: "charlie@example.com",
    password: "volunteer3pass",
  },
];

// Admin user in-memory store
let adminUser = {
  id: 100,
  username: "admin",
  password: "adminpass",
  name: "Administrator",
};

// Event assignments: eventId -> array of volunteerIds
let eventAssignments = {};

// Attendance records: eventId -> { volunteerId -> attended (bool) }
let attendanceRecords = {};

// Event joins: eventId -> array of volunteerIds who joined
let eventJoins = {};

// POST /api/login - authenticate user
app.post("/api/login", (req, res) => {
  const { id, password } = req.body;
  if (!id || !password) {
    return res.status(400).json({ error: "ID and password are required" });
  }

  // Check admin login
  if (id === adminUser.username && password === adminUser.password) {
    return res.json({
      userType: "admin",
      user: { id: adminUser.id, name: adminUser.name },
    });
  }

  // Check volunteer login by id (string or number)
  const volunteerId = parseInt(id);
  const volunteer = volunteers.find((v) => v.id === volunteerId);
  if (volunteer && volunteer.password === password) {
    return res.json({
      userType: "volunteer",
      user: { id: volunteer.id, name: volunteer.name, email: volunteer.email },
    });
  }

  return res.status(401).json({ error: "Invalid ID or password" });
});

// POST /api/events/:id/join - volunteer joins an event
app.post("/api/events/:id/join", (req, res) => {
  const eventId = parseInt(req.params.id);
  const { volunteerId } = req.body;
  if (!items.find((item) => item.id === eventId)) {
    return res.status(404).json({ error: "Event not found" });
  }
  if (!volunteers.find((v) => v.id === volunteerId)) {
    return res.status(404).json({ error: "Volunteer not found" });
  }
  eventJoins[eventId] = eventJoins[eventId] || [];
  if (!eventJoins[eventId].includes(volunteerId)) {
    eventJoins[eventId].push(volunteerId);
  }
  res.json({ message: "Joined event successfully" });
});

// GET /api/events/:id/joins - get volunteers who joined event
app.get("/api/events/:id/joins", (req, res) => {
  const eventId = parseInt(req.params.id);
  if (!items.find((item) => item.id === eventId)) {
    return res.status(404).json({ error: "Event not found" });
  }
  const joinedIds = eventJoins[eventId] || [];
  const joinedVolunteers = volunteers.filter((v) => joinedIds.includes(v.id));
  res.json(joinedVolunteers);
});

// GET /api/volunteers/:id/joins - get event IDs joined by volunteer
app.get("/api/volunteers/:id/joins", (req, res) => {
  const volunteerId = parseInt(req.params.id);
  if (!volunteers.find((v) => v.id === volunteerId)) {
    return res.status(404).json({ error: "Volunteer not found" });
  }
  const joinedEventIds = [];
  for (const [eventId, volunteerIds] of Object.entries(eventJoins)) {
    if (volunteerIds.includes(volunteerId)) {
      joinedEventIds.push(parseInt(eventId));
    }
  }
  res.json(joinedEventIds);
});

// Joi schema for item validation
const Joi = require("joi");
const itemSchema = Joi.object({
  name: Joi.string().min(1).required(),
  description: Joi.string().allow("").optional(),
});

// CRUD endpoints

// Create item
app.post("/api/items", (req, res) => {
  const { error, value } = itemSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  const newItem = { id: nextId++, ...value };
  items.push(newItem);
  res.status(201).json(newItem);
});

// Get all items
app.get("/api/items", (req, res) => {
  res.json(items);
});

// Get item by id
app.get("/api/items/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const item = items.find((i) => i.id === id);
  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }
  res.json(item);
});

// Update item by id
app.put("/api/items/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const itemIndex = items.findIndex((i) => i.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: "Item not found" });
  }
  const { error, value } = itemSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  items[itemIndex] = { id, ...value };
  res.json(items[itemIndex]);
});

// Delete item by id
app.delete("/api/items/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const itemIndex = items.findIndex((i) => i.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: "Item not found" });
  }
  items.splice(itemIndex, 1);
  res.status(204).send();
});

// Volunteers endpoints

// Get all volunteers
app.get("/api/volunteers", (req, res) => {
  res.json(volunteers);
});

// Assign volunteers to event
app.post("/api/events/:id/assign", (req, res) => {
  const eventId = parseInt(req.params.id);
  const { volunteerIds } = req.body;
  if (!Array.isArray(volunteerIds)) {
    return res.status(400).json({ error: "volunteerIds must be an array" });
  }
  if (!items.find((item) => item.id === eventId)) {
    return res.status(404).json({ error: "Event not found" });
  }
  eventAssignments[eventId] = volunteerIds;
  // Initialize attendance records for assigned volunteers
  attendanceRecords[eventId] = attendanceRecords[eventId] || {};
  volunteerIds.forEach((vid) => {
    attendanceRecords[eventId][vid] = false;
  });
  res.json({ message: "Volunteers assigned", assigned: volunteerIds });
});

// Get assigned volunteers for event
app.get("/api/events/:id/volunteers", (req, res) => {
  const eventId = parseInt(req.params.id);
  if (!items.find((item) => item.id === eventId)) {
    return res.status(404).json({ error: "Event not found" });
  }
  const assignedIds = eventAssignments[eventId] || [];
  const assignedVolunteers = volunteers.filter((v) =>
    assignedIds.includes(v.id)
  );
  res.json(assignedVolunteers);
});

// Get attendance for event
app.get("/api/events/:id/attendance", (req, res) => {
  const eventId = parseInt(req.params.id);
  if (!items.find((item) => item.id === eventId)) {
    return res.status(404).json({ error: "Event not found" });
  }
  const attendance = attendanceRecords[eventId] || {};
  res.json(attendance);
});

// Mark attendance for volunteer in event
app.post("/api/events/:id/attendance", (req, res) => {
  const eventId = parseInt(req.params.id);
  const { volunteerId, attended } = req.body;
  if (!items.find((item) => item.id === eventId)) {
    return res.status(404).json({ error: "Event not found" });
  }
  if (!volunteers.find((v) => v.id === volunteerId)) {
    return res.status(404).json({ error: "Volunteer not found" });
  }
  attendanceRecords[eventId] = attendanceRecords[eventId] || {};
  attendanceRecords[eventId][volunteerId] = !!attended;
  res.json({ message: "Attendance updated" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
