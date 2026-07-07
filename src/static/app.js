document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let activitiesData = {};

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function renderActivities() {
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    Object.entries(activitiesData).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const participants = Array.isArray(details.participants) ? details.participants : [];
      const spotsLeft = details.max_participants - participants.length;
      const participantItems = participants.length
        ? participants.map((email) => `
            <li class="participant-item">
              <span class="participant-email">${email}</span>
              <button type="button" class="delete-participant-btn" data-activity-name="${name}" data-email="${email}" aria-label="Remove ${email}">
                ✕
              </button>
            </li>
          `).join("")
        : '<li class="participant-item empty">No participants yet</li>';

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-section">
          <h5>Participants</h5>
          <ul class="participants-list">${participantItems}</ul>
        </div>
      `;

      activitiesList.appendChild(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      activitiesData = activities;
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function updateActivityParticipants(activityName, email, action) {
    if (!activitiesData[activityName]) {
      return;
    }

    const participants = Array.isArray(activitiesData[activityName].participants)
      ? [...activitiesData[activityName].participants]
      : [];

    if (action === "add" && !participants.includes(email)) {
      participants.push(email);
    } else if (action === "remove") {
      const participantIndex = participants.indexOf(email);
      if (participantIndex >= 0) {
        participants.splice(participantIndex, 1);
      }
    }

    activitiesData[activityName] = {
      ...activitiesData[activityName],
      participants,
    };

    renderActivities();
  }

  activitiesList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".delete-participant-btn");
    if (!deleteButton) {
      return;
    }

    const activityName = deleteButton.dataset.activityName;
    const email = deleteButton.dataset.email;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants/${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        updateActivityParticipants(activityName, email, "remove");
      } else {
        showMessage(result.detail || "Unable to unregister participant", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister participant. Please try again.", "error");
      console.error("Error unregistering participant:", error);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        updateActivityParticipants(activity, email, "add");
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
