const lapTimersContainer = document.getElementById('lapTimersContainer');
let raceStartTime = null; // Track the race start time
let lastPressTimes = {}; // Track the time of the last button press of cars

// Initialize Socket.IO connection
const socket = io();

// Function to enable lap timer buttons
function enableLapTimerButtons() {
    const carButtons = document.querySelectorAll('.carButton');
    carButtons.forEach(button => {
        button.disabled = false;
    });
}

// Function to disable lap timer buttons
function disableLapTimerButtons() {
    const carButtons = document.querySelectorAll('.carButton');
    carButtons.forEach(button => {
        button.disabled = true;
    });
}

// Function to render lap timer buttons for the active race
function renderLapTimerButtons(race) {
    lapTimersContainer.innerHTML = ""; // Clear existing buttons

    race.drivers.forEach(driver => {
        const row = document.createElement('div');
        row.className = 'carRow';

        const timeDisplay = document.createElement('p');
        timeDisplay.className = 'carTimeDisplay';
        timeDisplay.textContent = `${driver.carAssigned} last lap: N/A | Best lap: N/A`;

        const lapButton = document.createElement('button');
        lapButton.textContent = driver.carAssigned; // Button shows car number (e.g., "Car 1")
        lapButton.className = 'carButton';
        lapButton.id = driver.carAssigned;

        // Attach properties for lap timer
        lapButton.myTimeDisplay = timeDisplay;
        lapButton.carNumber = driver.carAssigned.replace("Car ", ""); // Extract car number

        row.appendChild(timeDisplay);
        row.appendChild(lapButton);
        lapTimersContainer.appendChild(row);

        lapButton.addEventListener('click', lapTimer); // Add click event for lap timing
    });
}

// Function to handle lap timing when button is clicked
function lapTimer(event) {
    const lapButton = event.currentTarget;
    const timeDisplay = lapButton.myTimeDisplay;
    const carNumber = lapButton.carNumber;

    if (!raceStartTime) {
        console.error("Race has not started yet.");
        return;
    }

    const currentTime = Date.now();
    let lapTime;

    if (!lastPressTimes[carNumber]) {
        // First press: calculate time from race start
        lapTime = currentTime - raceStartTime;
    } else {
        // Subsequent presses: calculate time since last press
        lapTime = currentTime - lastPressTimes[carNumber];
    }

    lastPressTimes[carNumber] = currentTime; // Update last pressed time

    const formattedLap = formatLapTime(lapTime);

    // Update best lap time if applicable
    if (!lapButton.dataset.bestLap || lapTime < parseInt(lapButton.dataset.bestLap)) {
        lapButton.dataset.bestLap = lapTime;
    }

    const bestLapTime = parseInt(lapButton.dataset.bestLap);
    const formattedBest = formatLapTime(bestLapTime);

    // Update the time display
    timeDisplay.textContent = `${lapButton.textContent} last lap: ${formattedLap} | Best lap: ${formattedBest}`;

    // Emit lap time data to the server
    socket.emit('lapTime', {
        carNumber: carNumber,
        lapTime: lapTime,
        formattedLap: formattedLap,
        bestLap: bestLapTime,
        formattedBest: formattedBest
    });
}

// Format lap time (mm:ss:ms)
function formatLapTime(timeInMs) {
    const minutes = Math.floor(timeInMs / 60000);
    const seconds = Math.floor((timeInMs % 60000) / 1000);
    const milliseconds = timeInMs % 1000;

    const formattedSeconds = seconds < 10 ? '0' + seconds : seconds;
    const formattedMilliseconds = milliseconds.toString().padStart(3, '0');

    return `${minutes}:${formattedSeconds}:${formattedMilliseconds}`;
}

// Listen for active race updates
socket.on('activeRace', (race) => {
    if (race && race.drivers.length > 0) {
        renderLapTimerButtons(race);
        enableLapTimerButtons();
    }
});

// Listen for race updates
socket.on('raceUpdate', (data) => {
    if (!data.running) {
        disableLapTimerButtons();
        lapTimersContainer.innerHTML = "<p>Race session has ended.</p>"; // Show race end message
    } else if (data.running) {
        // If race is running but start time is not set
        if (!raceStartTime) {
            let duration = Number(data.timerDuration);  // Race duration in seconds
            let remaining = Number(data.remainingTime); // Remaining time in seconds
           
            // When timer is ended and page is refreshed
            if (isNaN(remaining)) {
                remaining = 0;
            }
            // Calculate how long the race has been running
            const elapsedTime = (duration - remaining) * 1000;
            raceStartTime = Date.now() - elapsedTime; // Set the race start time
        }
    }
});

// Fullscreen and dark mode buttons (unchanged)
const fullscreenButton = document.createElement('button');
fullscreenButton.className = "fullscreenButton";
fullscreenButton.addEventListener('click', () => {
    document.documentElement.requestFullscreen();
});
document.body.appendChild(fullscreenButton);

const exitFullscreenButton = document.createElement('button');
exitFullscreenButton.className = "exitFullscreenButton";
exitFullscreenButton.addEventListener('click', () => {
    document.exitFullscreen();
});
document.body.appendChild(exitFullscreenButton);

exitFullscreenButton.style.display = 'none';

document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        fullscreenButton.style.display = 'none';
        exitFullscreenButton.style.display = 'inline-block';
    } else {
        fullscreenButton.style.display = 'inline-block';
        exitFullscreenButton.style.display = 'none';
    }
});

const darkModeButton = document.createElement('button');
darkModeButton.className = "darkModeButton";

const lightModeButton = document.createElement('button');
lightModeButton.className = "lightModeButton";
lightModeButton.style.display = 'none';

darkModeButton.addEventListener('click', () => {
    document.body.style.backgroundColor = "black";
    lapTimersContainer.style.backgroundColor = "black";
    const rows = lapTimersContainer.querySelectorAll('.carRow');
    rows.forEach(row => {
        row.style.backgroundColor = "rgb(43, 43, 43)";
        row.style.color = "white";
    });
    darkModeButton.style.display = 'none';
    lightModeButton.style.display = 'inline-block';
});

lightModeButton.addEventListener('click', () => {
    document.body.style.backgroundColor = "rgb(175, 175, 175)";
    lapTimersContainer.style.backgroundColor = "rgb(175, 175, 175)";
    const rows = lapTimersContainer.querySelectorAll('.carRow');
    rows.forEach(row => {
        row.style.backgroundColor = "white";
        row.style.color = "#000000";
    });
    lightModeButton.style.display = 'none';
    darkModeButton.style.display = 'inline-block';
});

document.body.appendChild(darkModeButton);
document.body.appendChild(lightModeButton);