/**
 * Frontend script for AKSV System
 * Supports login, event listing, joining, and admin event creation.
 */

const apiBaseUrl = "http://localhost:3000/api";

const loginForm = document.getElementById("loginForm");
const eventListView = document.getElementById("eventListView");
const eventDetailView = document.getElementById("eventDetailView");
const backToEventsBtn = document.getElementById("backToEventsBtn");

const adminView = document.getElementById("adminView");
const backToLoginFromAdminBtn = document.getElementById(
  "backToLoginFromAdminBtn"
);
const adminCreateEventForm = document.getElementById("adminCreateEventForm");
const adminEventSelect = document.getElementById("adminEventSelect");
const adminVolunteerList = document.getElementById("adminVolunteerList");
const adminCreateEventError = document.getElementById("adminCreateEventError");

let loggedInUser = null;
let joinedEventIds = [];
let currentEvent = null;

function showView(view) {
  const views = [
    loginForm.parentElement,
    eventListView,
    eventDetailView,
    adminView,
  ];
  views.forEach((v) => v.classList.add("hidden"));

  switch (view) {
    case "login":
      loginForm.parentElement.classList.remove("hidden");
      break;
    case "eventListView":
      eventListView.classList.remove("hidden");
      break;
    case "eventDetailView":
      eventDetailView.classList.remove("hidden");
      break;
    case "adminView":
      adminView.classList.remove("hidden");
      break;
  }
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("loginId").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!id || !password) {
    alert("Please enter both ID and password.");
    return;
  }

  try {
    const res = await fetch(`${apiBaseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Login failed");
      return;
    }
    const data = await res.json();
    loggedInUser = data.user;

    if (data.userType === "admin") {
      showView("adminView");
      loadEvents();
    } else if (data.userType === "volunteer") {
      const joinedRes = await fetch(
        `${apiBaseUrl}/volunteers/${loggedInUser.id}/joins`
      );
      if (joinedRes.ok) {
        const joinedData = await joinedRes.json();
        // Normalize joinedEventIds to array of event IDs (numbers or strings)
        joinedEventIds = joinedData.map((item) => {
          if (typeof item === "object" && item !== null) {
            return item.id || item.eventId || item;
          }
          return item;
        });
      } else {
        joinedEventIds = [];
      }
      alert(`Welcome, ${data.user.name}`);
      showView("eventListView");
      loadEvents();
    } else {
      alert("Unknown user type");
    }
  } catch (error) {
    alert("Error during login");
    console.error(error);
  }
});

async function loadEvents() {
  try {
    const res = await fetch(`${apiBaseUrl}/items`);
    if (!res.ok) throw new Error("Failed to fetch events");
    const events = await res.json();
    renderEventCards(events);
    populateAdminEventSelect(events);
  } catch (error) {
    console.error("Error loading events:", error);
  }
}

function renderEventCards(events) {
  eventListView.innerHTML =
    '<button id="logoutBtn" class="back-btn">Logout</button>';
  events.forEach((event) => {
    const card = document.createElement("div");
    card.className = "event-card";
    card.textContent = event.name;

    if (
      loggedInUser &&
      joinedEventIds.some((joinedId) => String(joinedId) === String(event.id))
    ) {
      card.textContent += " (Already Joined)";
      card.style.opacity = "0.6";
      card.style.pointerEvents = "none";
    } else {
      card.onclick = () => openEventDetail(event);
    }
    eventListView.appendChild(card);
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    logout();
  });
}

function openEventDetail(event) {
  currentEvent = event;
  document.getElementById("eventDetailTitle").textContent = event.name;
  document.getElementById("eventDetailDescription").textContent =
    event.description || "";

  const dateList = document.getElementById("eventDateList");
  dateList.innerHTML = "";
  if (event.dates && Array.isArray(event.dates)) {
    event.dates.forEach((date) => {
      const div = document.createElement("div");
      div.className = "date-item";
      div.textContent = date;
      dateList.appendChild(div);
    });
  }

  showView("eventDetailView");

  const joinBtn = document.getElementById("joinEventBtn");
  joinBtn.style.display = "inline-block";
  joinBtn.disabled = false;
  joinBtn.textContent = "JOIN";

  if (loggedInUser && joinedEventIds.includes(event.id)) {
    joinBtn.disabled = true;
    joinBtn.textContent = "Already Joined";
  }

  joinBtn.onclick = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/events/${event.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteerId: loggedInUser.id }),
      });
      if (res.ok) {
        alert(`You have joined ${event.name}!`);
        // After joining, reload joined events from backend to ensure consistency
        const joinedRes = await fetch(
          `${apiBaseUrl}/volunteers/${loggedInUser.id}/joins`
        );
        if (joinedRes.ok) {
          const joinedData = await joinedRes.json();
          joinedEventIds = joinedData.map((item) => {
            if (typeof item === "object" && item !== null) {
              return item.id || item.eventId || item;
            }
            return item;
          });
        }
        joinBtn.disabled = true;
        joinBtn.textContent = "Already Joined";
        // Update event list cards to reflect joined status
        loadEvents();
      } else {
        alert("Failed to join event");
      }
    } catch (error) {
      alert("Error joining event");
    }
  };
}

backToEventsBtn.addEventListener("click", () => {
  showView("eventListView");
});

backToLoginFromAdminBtn.addEventListener("click", () => {
  logout();
});

function populateAdminEventSelect(events) {
  adminEventSelect.innerHTML = '<option value="">Select Event</option>';
  events.forEach((event) => {
    const option = document.createElement("option");
    option.value = event.id;
    option.textContent = event.name;
    adminEventSelect.appendChild(option);
  });
  adminVolunteerList.innerHTML = "";
}

adminEventSelect.addEventListener("change", async () => {
  const eventId = adminEventSelect.value;
  if (!eventId) {
    adminVolunteerList.innerHTML = "";
    return;
  }
  try {
    const res = await fetch(`${apiBaseUrl}/events/${eventId}/joins`);
    if (!res.ok) throw new Error("Failed to fetch volunteers");
    const volunteers = await res.json();
    renderAdminVolunteerList(volunteers);
  } catch (error) {
    console.error("Error loading volunteers:", error);
  }
});

function renderAdminVolunteerList(volunteers) {
  adminVolunteerList.innerHTML = "";
  if (volunteers.length === 0) {
    adminVolunteerList.textContent = "No volunteers joined this event.";
    return;
  }
  volunteers.forEach((volunteer) => {
    const li = document.createElement("li");
    li.textContent = `${volunteer.name} (${volunteer.email})`;
    adminVolunteerList.appendChild(li);
  });
}

adminCreateEventForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  adminCreateEventError.textContent = "";
  const name = document.getElementById("adminEventName").value.trim();
  const description = document
    .getElementById("adminEventDescription")
    .value.trim();

  if (!name) {
    adminCreateEventError.textContent = "Event name is required.";
    return;
  }

  try {
    const res = await fetch(`${apiBaseUrl}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    if (!res.ok) throw new Error("Failed to create event");
    alert("Event created successfully");
    adminCreateEventForm.reset();
    loadEvents();
  } catch (error) {
    adminCreateEventError.textContent = error.message;
  }
});

function logout() {
  loggedInUser = null;
  joinedEventIds = [];
  currentEvent = null;
  showView("login");
}

showView("login");
