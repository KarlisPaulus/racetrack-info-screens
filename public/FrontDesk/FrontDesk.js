document.addEventListener("DOMContentLoaded", () => {
	// Dark/light mode toggle functionality
    const darkModeButton = document.getElementById('darkModeButton');
    const lightModeButton = document.getElementById('lightModeButton');
    const fullscreenButton = document.getElementById('fullscreenButton');
    const exitFullscreenButton = document.getElementById('exitFullscreenButton');

    // Check for saved mode preference or use preferred color scheme
    const savedMode = localStorage.getItem('mode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedMode === 'dark' || (!savedMode && prefersDark)) {
        document.body.classList.add('dark-mode');
        darkModeButton.style.display = 'none';
        lightModeButton.style.display = 'inline-block';
    }

    // Mode toggle buttons
    darkModeButton.addEventListener('click', () => {
        document.body.classList.add('dark-mode');
        localStorage.setItem('mode', 'dark');
        darkModeButton.style.display = 'none';
        lightModeButton.style.display = 'inline-block';
    });

    lightModeButton.addEventListener('click', () => {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('mode', 'light');
        lightModeButton.style.display = 'none';
        darkModeButton.style.display = 'inline-block';
    });

    // Fullscreen functionality
    fullscreenButton.addEventListener('click', () => {
        document.documentElement.requestFullscreen();
    });

    exitFullscreenButton.addEventListener('click', () => {
        document.exitFullscreen();
    });

    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            fullscreenButton.style.display = 'none';
            exitFullscreenButton.style.display = 'inline-block';
        } else {
            fullscreenButton.style.display = 'inline-block';
            exitFullscreenButton.style.display = 'none';
        }
    });

	// DOM Elements
    const raceList = document.getElementById("race-list");
    const raceForm = document.getElementById("race-form");
	const raceDetailsName = document.getElementById("race-details-name");
    const raceDetailsDriverCount = document.getElementById("race-details-driver-count");
    const raceDetailsDrivers = document.getElementById("race-details-drivers");
    const addDriverBtn = document.getElementById("add-driver-btn");
    const deleteRaceBtn = document.getElementById("delete-race-btn");

	// Modals
    const changeNameModal = document.getElementById("change-name-modal");
    const addDriverModal = document.getElementById("add-driver-modal");
	const editDriverModal = document.getElementById("edit-driver-modal");
    const deleteRaceModal = document.getElementById("delete-race-modal");
	const deleteDriverModal = document.getElementById("delete-driver-modal");
	
	// Forms
    const changeNameForm = document.getElementById("change-name-form");
    const addDriverForm = document.getElementById("add-driver-form");
	const editDriverForm = document.getElementById("edit-driver-form");

	// Buttons
    const confirmDeleteBtn = document.getElementById("confirm-delete");
    const cancelDeleteBtn = document.getElementById("cancel-delete");
	const cancelDeleteDriver = document.getElementById("cancel-delete-driver");
	const changeNameBtn = document.getElementById("change-name-btn");
    const cancelChangeNameBtn = document.getElementById("cancel-change-name");
    const cancelAddDriverBtn = document.getElementById("cancel-add-driver");
	const cancelEditDriverBtn = document.getElementById("cancel-edit-driver");
	const confirmDeleteDriver = document.getElementById("confirm-delete-driver");

	// State
    let races = []; // Store races globally
    let selectedRaceId = null; // Track the selected race for various actions
	let selectedDriverName = null; // Track the selected driver for editing

    const socket = io(window.location.origin, {
  transports: ['websocket'] // force WebSocket only
});

	// Initialization
	fetchRaces();
    clearRaceDetails();

	// Socket.IO Listeners
    socket.on('raceCreated', (race) => {
        console.log("New race created:", race);
        fetchRaces();
    });

    socket.on('raceUpdated', (race) => {
        console.log("Race updated:", race);
        // Update the local races array
        const raceIndex = races.findIndex(r => r.id === race.id);
        if (raceIndex !== -1) {
        races[raceIndex] = race; // Replace the old race with the updated one
    }
		if (selectedRaceId === race.id) {
			showRaceDetails(race.id); // Refresh the Race Details section
		}
        fetchRaces();
    });

    socket.on('raceDeleted', (raceId) => {
        console.log("Race deleted:", raceId);
        fetchRaces();
        if (selectedRaceId === raceId) {
            clearRaceDetails();
            selectedRaceId = null;
        }
    });

    socket.on('racesList', (races) => {
        console.log("Received races list:", races);
        renderRaces(races);
        clearRaceDetails();
    });
    

	// FUNCTIONS

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
			li.onclick = () => showRaceDetails(race.id);
            raceList.appendChild(li);
        });
    }

	// Show race details
    function showRaceDetails(raceId) {
        const race = races.find(r => r.id === raceId);
        if (!race) return;

        selectedRaceId = raceId;
        raceDetailsName.textContent = race.name;
        raceDetailsDriverCount.textContent = race.drivers.length;

        // Render drivers
        raceDetailsDrivers.innerHTML = "";
        race.drivers.forEach(driver => {
            const li = document.createElement("li");
            li.textContent = `${driver.name} - ${driver.carAssigned}`;

            // Edit Driver Button
            const editDriverBtn = document.createElement("button");
            editDriverBtn.textContent = "Edit";
            editDriverBtn.onclick = () => openEditDriverModal(raceId, driver.name);

            // Remove Driver Button
            const removeDriverBtn = document.createElement("button");
            removeDriverBtn.textContent = "Remove";
            removeDriverBtn.classList.add("delete-btn");
            removeDriverBtn.onclick = () => openDeleteDriverModal(raceId, driver.name);

            li.appendChild(editDriverBtn);
            li.appendChild(removeDriverBtn);
            raceDetailsDrivers.appendChild(li);
        });
    }
	
	// Clear race details
	function clearRaceDetails() {
	    raceDetailsName.textContent = "";
	    raceDetailsDriverCount.textContent = "";
	    raceDetailsDrivers.innerHTML = "";
	}

    // Open Change Name modal
    function openChangeNameModal(raceId) {
        selectedRaceId = raceId;
        changeNameModal.style.display = "flex";
    }

    // Open Add Driver modal
    function openAddDriverModal(raceId) {
        selectedRaceId = raceId;
        addDriverModal.style.display = "flex";
    }

	// Open the Edit Driver modal
    function openEditDriverModal(raceId, driverName) {
        selectedRaceId = raceId;
        selectedDriverName = driverName;
        const race = races.find(r => r.id === raceId);
        const driver = race.drivers.find(d => d.name === driverName);

        document.getElementById("edit-driver-name").value = driver.name;
        document.getElementById("edit-car-id").value = driver.carAssigned.replace("Car ", "");
        editDriverModal.style.display = "flex";
    }

    // Open the Delete Race modal
    function openDeleteRaceModal(raceId) {
        selectedRaceId = raceId;
        deleteRaceModal.style.display = "flex";
    }

	// Open the Delete Driver modal
	function openDeleteDriverModal(raceId, driverName) {
		selectedRaceId = raceId;
		selectedDriverName = driverName;
		deleteDriverModal.style.display = "flex";
	}

	// Close all modals
    function closeModals() {
        changeNameModal.style.display = "none";
        addDriverModal.style.display = "none";
		editDriverModal.style.display = "none";
        deleteRaceModal.style.display = "none";
		deleteDriverModal.style.display = "none";
    }

	// Remove a driver from the race
    async function removeDriver() {
		try {
			const race = races.find(r => r.id === selectedRaceId);
			if (!race) throw new Error("Race not found.");
			const driver = race.drivers.find(d => d.name === selectedDriverName);
            if (!driver) throw new Error("Driver not found.");

            const driverUpdate = {
                id: driver.id,
                action: "delete",
            };
	
			const response = await fetch(`/api/races/${selectedRaceId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ drivers: [driverUpdate] }),
			});
	
			if (!response.ok) throw new Error("Failed to remove driver.");
			fetchRaces(); // Refresh the race list
			showRaceDetails(selectedRaceId); // Refresh the race details
			closeModals();
		} catch (error) {
			console.error("Error removing driver:", error);
			alert("Failed to remove driver.");
		}
	}


	// EVENT LISTENERS

	// Change race name button
	changeNameBtn.addEventListener("click", () => {
		if (!selectedRaceId) {
			alert("Please select a race first.");
			return;
		}
		openChangeNameModal(selectedRaceId);
	});

	// Add Driver modal
    addDriverBtn.addEventListener("click", () => {
        if (!selectedRaceId) {
            alert("Please select a race first.");
            return;
        }
        openAddDriverModal(selectedRaceId);
    });

	// Delete Race modal
    deleteRaceBtn.addEventListener("click", () => {
        if (!selectedRaceId) {
            alert("Please select a race first.");
            return;
        }
        openDeleteRaceModal(selectedRaceId);
    });

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
			showRaceDetails(selectedRaceId); // Refresh the Race Details section
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
			closeModals();
		} catch (error) {
			console.error("Error creating driver and assigning car:", error);
			alert("Failed to create driver and assign car.");
		}
	});

	// Edit Driver form submission
    editDriverForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		const newDriverName = document.getElementById("edit-driver-name").value;
		const newCarId = document.getElementById("edit-car-id").value;
	
		// Validate car ID
		if (isNaN(newCarId)) {
			alert("Invalid car ID. Please enter a valid number.");
			return;
		}

		// Get the current race
		const race = races.find(r => r.id === selectedRaceId);
		if (!race) return;

		// Check if new driver name already exists
		const nameExists = race.drivers.some(d => d.name === newDriverName && d.name !== selectedDriverName);
		if (nameExists) {
			alert(`Driver ${newDriverName} already exists in this race.`);
			return;
		}
	
		// Check if car ID is already in use
		const carExists = race.drivers.some(d => d.carAssigned === `Car ${newCarId}` && d.name !== selectedDriverName);
		if (carExists) {
			alert(`Car ${newCarId} is already assigned to another driver.`);
			return;
		}
	
		try {
			const driverUpdate = {
                id: race.drivers.find(d => d.name === selectedDriverName).id, // Find the driver's ID
                name: newDriverName,
                carAssigned: `Car ${newCarId}`,
                action: "update",
            };
	
			const response = await fetch(`/api/races/${selectedRaceId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({drivers: [driverUpdate]}),
			});
	
			if (!response.ok) throw new Error("Failed to update driver.");
			fetchRaces(); // Refresh the race list
			showRaceDetails(selectedRaceId); // Refresh the race details
			closeModals();
		} catch (error) {
			console.error("Error updating driver:", error);
			alert("Failed to update driver.");
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

	// Confirm Delete Driver
	confirmDeleteDriver.addEventListener("click", removeDriver);

    // Cancel actions
    cancelChangeNameBtn.addEventListener("click", closeModals);
    cancelAddDriverBtn.addEventListener("click", closeModals);
    cancelDeleteBtn.addEventListener("click", closeModals);
	cancelEditDriverBtn.addEventListener("click", closeModals);
	cancelDeleteDriver.addEventListener("click", closeModals);

    // Handle race form submission
    raceForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const raceName = document.getElementById("race-name").value;

        try {
            const response = await fetch("/api/races", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: raceName }),
            });
            if (!response.ok) throw new Error("Failed to create race.");
            raceForm.reset(); // Clear the form
            fetchRaces(); // Refresh the race list
        } catch (error) {
            console.error("Error creating race:", error);
            alert("Failed to create race.");
        }
    });

    // Add mobile-specific touch feedback
    function setupMobileInteractions() {
        // Touch feedback for list items
        document.querySelectorAll('#race-list li, button').forEach(element => {
            element.addEventListener('touchstart', function() {
                this.classList.add('touch-active');
            });
            
            element.addEventListener('touchend', function() {
                this.classList.remove('touch-active');
            });
        });
    }

    // Adjust layout on resize
    function handleResize() {
        if (window.innerWidth <= 768) {
            // Mobile-specific adjustments
            document.querySelectorAll('input, button').forEach(el => {
                el.style.minHeight = '44px';
            });
        }
    }

    // Initialize
    if ('ontouchstart' in window) {
        setupMobileInteractions();
    }
    handleResize();
    window.addEventListener('resize', handleResize);

    // Add CSS for touch feedback
    const style = document.createElement('style');
    style.textContent = `
        .touch-active {
            opacity: 0.8;
            transform: scale(0.98);
            transition: all 0.1s;
        }
        
        @media (max-width: 768px) {
            #race-list li {
                padding: 12px !important;
            }
            
            button {
                margin: 4px 0 !important;
            }
        }
    `;
    document.head.appendChild(style);
});