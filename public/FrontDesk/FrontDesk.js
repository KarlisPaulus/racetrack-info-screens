document.addEventListener("DOMContentLoaded", () => {
    const raceList = document.getElementById("race-list");
    const raceForm = document.getElementById("race-form");
    const changeNameModal = document.getElementById("change-name-modal");
    const addDriverModal = document.getElementById("add-driver-modal");
    const deleteRaceModal = document.getElementById("delete-race-modal");
    const changeNameForm = document.getElementById("change-name-form");
    const addDriverForm = document.getElementById("add-driver-form");
    const confirmDeleteBtn = document.getElementById("confirm-delete");
    const cancelDeleteBtn = document.getElementById("cancel-delete");
    const cancelChangeNameBtn = document.getElementById("cancel-change-name");
    const cancelAddDriverBtn = document.getElementById("cancel-add-driver");

    let races = []; // Store races globally
    let selectedRaceId = null; // Track the selected race for various actions

    const socket = io();

    // Fetch all races
    async function fetchRaces() {
        try {
            const response = await fetch("/api/races");
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            races = data;
            renderRaces(data);
        } catch (error) {
            console.error("Error fetching races:", error);
            alert("Failed to load races.");
        }
    }

    // Render races in the UI
    function renderRaces(races) {
        raceList.innerHTML = "";
        races.forEach(race => {
            const li = document.createElement("li");
            li.textContent = `${race.name} (${race.drivers.length} drivers)`;

            // Change Name Button
            const changeNameBtn = document.createElement("button");
            changeNameBtn.textContent = "Change Name";
            changeNameBtn.onclick = () => openChangeNameModal(race.id);

            // Add Driver Button
            const addDriverBtn = document.createElement("button");
            addDriverBtn.textContent = "Add Driver";
            addDriverBtn.onclick = () => openAddDriverModal(race.id);

            // Delete Button
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.classList.add("delete-btn");
            deleteBtn.onclick = () => openDeleteRaceModal(race.id);

            li.appendChild(changeNameBtn);
            li.appendChild(addDriverBtn);
            li.appendChild(deleteBtn);
            raceList.appendChild(li);
        });
    }

    // Open the Change Name modal
    function openChangeNameModal(raceId) {
        selectedRaceId = raceId;
        changeNameModal.style.display = "flex";
    }

    // Open the Add Driver modal
    function openAddDriverModal(raceId) {
        selectedRaceId = raceId;
        addDriverModal.style.display = "flex";
    }

    // Open the Delete Race modal
    function openDeleteRaceModal(raceId) {
        selectedRaceId = raceId;
        deleteRaceModal.style.display = "flex";
    }

    // Close all modals
    function closeModals() {
        changeNameModal.style.display = "none";
        addDriverModal.style.display = "none";
        deleteRaceModal.style.display = "none";
    }

    // Change Name form submission
    changeNameForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const newName = document.getElementById("new-race-name").value;

        try {
            const response = await fetch(`/api/races/${selectedRaceId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName }),
            });
            if (!response.ok) throw new Error("Failed to update race name.");
            fetchRaces(); // Refresh the race list
            closeModals();
        } catch (error) {
            console.error("Error updating race name:", error);
            alert("Failed to update race name.");
        }
    });

    // Add Driver form submission
    addDriverForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		const driverName = document.getElementById("driver-name").value;
		const carId = document.getElementById("car-id").value;
	
		if (!driverName || !carId) {
			alert("Driver name and car ID are required.");
			return;
		}
	
		try {
			const response = await fetch(`/api/races/${selectedRaceId}/create-driver`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ driverName, carId }),
			});
	
			const data = await response.json();
	
			if (!response.ok) {
				// Handle specific error messages from the backend
				if (data.message.includes("already exists")) {
					alert(data.message); // Display the error message to the user
				} else if (data.message.includes("maximum of 8 drivers")) {
					alert(data.message);
				} else if (data.message.includes("Invalid car ID")) {
					alert(data.message);
				} else {
					throw new Error("Failed to create driver and assign car.");
				}
				return;
			}
	
			console.log("Driver created and car assigned successfully:", data);
			fetchRaces(); // Refresh the race list
			closeModals();
		} catch (error) {
			console.error("Error creating driver and assigning car:", error);
			alert("Failed to create driver and assign car.");
		}
	});

    // Confirm Delete Race
    confirmDeleteBtn.addEventListener("click", async () => {
        try {
            const response = await fetch(`/api/races/${selectedRaceId}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Failed to delete race.");
            fetchRaces(); // Refresh the race list
            closeModals();
        } catch (error) {
            console.error("Error deleting race:", error);
            alert("Failed to delete race.");
        }
    });

    // Cancel actions
    cancelChangeNameBtn.addEventListener("click", closeModals);
    cancelAddDriverBtn.addEventListener("click", closeModals);
    cancelDeleteBtn.addEventListener("click", closeModals);

    // Handle race form submission
    raceForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const raceName = document.getElementById("race-name").value;

        try {
            const response = await fetch("/api/races", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: raceName, drivers: [] }),
            });
            if (!response.ok) throw new Error("Failed to create race.");
            raceForm.reset(); // Clear the form
            fetchRaces(); // Refresh the race list
        } catch (error) {
            console.error("Error creating race:", error);
            alert("Failed to create race.");
        }
    });

    // Initial fetch of races when page loads
    fetchRaces();

    // Listen for new races
    socket.on('raceCreated', (race) => {
        fetchRaces(); // Refresh the race list
    });

    // Listen for updated races
    socket.on('raceUpdated', (race) => {
        fetchRaces(); // Refresh the race list
    });

    // Listen for deleted races
    socket.on('raceDeleted', (raceId) => {
        fetchRaces(); // Refresh the race list
    });
});