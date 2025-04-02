document.addEventListener("DOMContentLoaded", () => {

	// Add dark/light mode toggle functionality
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
	
    const nextRaceName = document.getElementById("next-race-name");
    const nextRaceDriverCount = document.getElementById("next-race-driver-count");
    const nextRaceDrivers = document.getElementById("next-race-drivers");
    const paddockMessage = document.getElementById("paddock-message");

    const socket = io();

    // Listen for race updates from the server
    socket.on('raceCreated', (race) => {
        console.log("Race created:", race);
        socket.emit("getRaces");
    });

    socket.on('raceUpdated', (race) => {
        console.log("Race updated:", race);
        socket.emit("getRaces");
    });

    socket.on('raceDeleted', (raceId) => {
        console.log("Race deleted:", raceId);
        socket.emit('getRaces'); // Request updated list of races
    });

    // Listen for the list of races from the server
    socket.on('racesList', (races) => {
        console.log("Received races list:", races);
        if (races.length > 0) {
            const nextRace = races[0]; // The first race in the list is the next race
            renderNextRace(nextRace);
        } else {
            renderNoRace();
        }
    });

    // Request the list of races from the server
    socket.emit('getRaces');

    // Render the next race details
    function renderNextRace(race) {
        console.log("Rendering next race:", race);
        nextRaceName.textContent = race.name;
        nextRaceDriverCount.textContent = race.drivers.length;
        paddockMessage.textContent = "Drivers, please proceed to the paddock.";

        // Render drivers
        nextRaceDrivers.innerHTML = "";
        race.drivers.forEach(driver => {
            const li = document.createElement("li");
            li.textContent = `${driver.name} - ${driver.carAssigned}`;
            nextRaceDrivers.appendChild(li);
        });
    }

    // Render a message when there are no races
    function renderNoRace() {
        console.log("No upcoming races.");
        nextRaceName.textContent = "No upcoming races.";
        nextRaceDriverCount.textContent = "0";
        nextRaceDrivers.innerHTML = "";
        paddockMessage.textContent = "";
    }
});