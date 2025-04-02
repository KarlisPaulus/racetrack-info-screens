const lapTimersContainer = document.getElementById('lapTimersContainer');
let raceStartTime = null; // Track the race start time
let lastPressTimes = {}; // Track the time of the last button press of cars
let currentRace = null;

// Initialize Socket.IO connection
const socket = io();

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
        lapTime = currentTime - raceStartTime;
    } else {
        lapTime = currentTime - lastPressTimes[carNumber];
    }

    lastPressTimes[carNumber] = currentTime;

    const formattedLap = formatLapTime(lapTime);

    if (!lapButton.dataset.bestLap || lapTime < parseInt(lapButton.dataset.bestLap)) {
        lapButton.dataset.bestLap = lapTime;
    }

    const bestLapTime = parseInt(lapButton.dataset.bestLap);
    const formattedBest = formatLapTime(bestLapTime);

    timeDisplay.textContent = `${lapButton.textContent} last lap: ${formattedLap} | Best lap: ${formattedBest}`;

    let lapCount = Number(lapButton.dataset.lapCount) || 0;
    lapCount += 1;
    lapButton.dataset.lapCount = lapCount;

    // Ensure we have a race ID before emitting
    if (!currentRace?.id) {
        console.error("No active race ID available");
        return;
    }

    socket.emit('saveLapTime', {
        raceId: currentRace.id,
        carNumber: parseInt(carNumber),
        lapTime: lapTime,
        formattedLap: formattedLap,
        bestLap: bestLapTime,
        formattedBest: formattedBest,
        lapCount: lapCount
    });

    console.log('Lap recorded:', {
        carNumber: carNumber,
        lapTime: lapTime,
        lapCount: lapCount
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
    console.log("Received active race:", race);
    currentRace = race;
    if (race && race.drivers.length > 0) {
        renderLapTimerButtons(race);
        enableLapTimerButtons();
        
        // Initialize last press times for each driver
        race.drivers.forEach(driver => {
            const carNum = driver.carAssigned.replace('Car ', '');
            lastPressTimes[carNum] = null;
        });
    }
});

// Listen for race updates
socket.on('raceUpdate', (data) => {
    console.log('Race state update:', data.mode, 'Running:', data.running);
    
    if (data.mode === "Finished" || !data.running) {
        // Disable all buttons and change their appearance
        const buttons = document.querySelectorAll('.carButton');
        buttons.forEach(button => {
            button.disabled = true;
            button.style.backgroundColor = '#cccccc';
            button.style.cursor = 'not-allowed';
        });
        
        // Show race ended message
        lapTimersContainer.innerHTML = `
            <div class="race-ended-message">
                Race Session Has Ended
            </div>
        `;
        
        // Reset timing data
        raceStartTime = null;
        lastPressTimes = {};
    } else if (data.running) {
        // Re-enable buttons if race is running
        const buttons = document.querySelectorAll('.carButton');
        buttons.forEach(button => {
            button.disabled = false;
            button.style.backgroundColor = '#2D8C2D';
            button.style.cursor = 'pointer';
        });
        
        // Initialize timing if not already set
        if (!raceStartTime) {
            const duration = Number(data.timerDuration) || 600;
            const remaining = Number(data.remainingTime) || duration;
            const elapsed = (duration - remaining) * 1000;
            raceStartTime = Date.now() - elapsed;
        }
    }
});

document.body.appendChild(darkModeButton);
document.body.appendChild(lightModeButton);