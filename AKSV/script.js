document.getElementById("signInBtn").addEventListener("click", function () {
  document.querySelector(".container").classList.add("hidden");
  document.getElementById("eventListView").classList.remove("hidden");
});

function goBackToLogin() {
  document.querySelector(".container").classList.remove("hidden");
  document.getElementById("eventListView").classList.add("hidden");
}

// Event data
const events = {
  "Children Art WORKSHOP": {
    description: "Ihafta boyunca etkinligimize gönülüller aranıyordur.",
    dates: ["22.01.2022", "23.01.2022", "24.01.2022"],
  },
  "Doğa gezisi": {
    description: "Doğayla iç içe bir gezi etkinliği",
    dates: ["25.01.2022", "26.01.2022", "27.01.2022"],
  },
};

// Open event detail view
function openEventDetail(eventName) {
  // Set event details
  document.getElementById("eventDetailTitle").textContent = eventName;
  document.getElementById("eventDetailDescription").textContent =
    events[eventName].description;

  // Create date list
  const dateList = document.getElementById("eventDateList");
  dateList.innerHTML = "";
  events[eventName].dates.forEach((date) => {
    const dateElement = document.createElement("div");
    dateElement.className = "date-item";
    dateElement.textContent = date;
    dateList.appendChild(dateElement);
  });

  // Show detail view
  document.getElementById("eventListView").classList.add("hidden");
  document.getElementById("eventDetailView").classList.remove("hidden");

  // Set up join button
  document.getElementById("joinEventBtn").onclick = function () {
    alert(`You have joined ${eventName}!`);
    document.getElementById("eventDetailView").classList.add("hidden");
    document.getElementById("eventListView").classList.remove("hidden");
  };
}

// Initialize event cards when DOM loads
document.addEventListener("DOMContentLoaded", function () {
  // Set up event cards
  const cards = document.querySelectorAll(".event-card");
  cards[0].onclick = function () {
    openEventDetail("Children Art WORKSHOP");
  };
  cards[1].onclick = function () {
    openEventDetail("Doğa gezisi");
  };

  // Set up back button in detail view
  document.querySelector("#eventDetailView .back-btn").onclick = function () {
    document.getElementById("eventDetailView").classList.add("hidden");
    document.getElementById("eventListView").classList.remove("hidden");
  };

  // Set up navigation buttons
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    if (btn.textContent === "Home") {
      btn.onclick = function () {
        document.querySelector(".container").classList.add("hidden");
        document.getElementById("eventListView").classList.add("hidden");
        document.getElementById("eventDetailView").classList.add("hidden");
        document.getElementById("homeView").classList.remove("hidden");
      };
    } else if (btn.textContent === "Profile") {
      btn.onclick = function () {
        document.querySelector(".container").classList.add("hidden");
        document.getElementById("eventListView").classList.add("hidden");
        document.getElementById("eventDetailView").classList.add("hidden");
        document.getElementById("profileView").classList.remove("hidden");
      };
    }
  });
});
