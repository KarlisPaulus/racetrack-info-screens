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
	
    const socket = io('http://localhost:3000', {
  transports: ['websocket'] // force WebSocket only
});
    const leaderboardBody = document.getElementById("leaderboard-body");
    const timerDisplay = document.querySelector(".timer-display");
    const flagDisplay = document.querySelector(".flag-display");
    
    let currentRace = null;
    let raceData = {};
    let raceStatus = {
        running: false,
        mode: "Danger",
        remainingTime: 0,
        timerDuration: 600
    };
    let currentLapStartTimes = {};
    let updateInterval = null;
    let previousRaceData = null;
	let lastTimerUpdate = null;
	let localTimerInterval = null;
	let currentRemainingTime = 0;


    function formatLapTime(timeInMs) {
        if (!timeInMs) return "N/A";
        const minutes = Math.floor(timeInMs / 60000);
        const seconds = Math.floor((timeInMs % 60000) / 1000);
        const milliseconds = Math.floor((timeInMs % 1000) / 10);
        return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    }

    function initLeaderboard(race) {
        currentRace = race;
        raceData = {};
        currentLapStartTimes = {};
        
        if (race?.drivers) {
            race.drivers.forEach(driver => {
                const carNumber = driver.carAssigned.replace('Car ', '');
                raceData[carNumber] = {
                    name: driver.name,
                    carAssigned: driver.carAssigned,
                    laps: driver.LapTimes?.length || 0,
                    lastLap: null,
                    bestLap: null,
                    currentLap: 0
                };
                
                if (driver.LapTimes?.length > 0) {
                    driver.LapTimes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));  // Sort laptimes by creation date
                    const lastLap = driver.LapTimes[driver.LapTimes.length - 1];
                    raceData[carNumber].lastLap = lastLap.lapTime;
                    raceData[carNumber].bestLap = Math.min(...driver.LapTimes.map(l => l.lapTime));
                }
                
                currentLapStartTimes[carNumber] = Date.now();
            });
        }
        
        startUpdateInterval();
        updateLeaderboard();
    }

    function updateLeaderboard() {
        if (!currentRace && !previousRaceData) {
            leaderboardBody.innerHTML = '<tr><td colspan="7">No active race</td></tr>';
            return;
        }

        const dataToUse = currentRace ? {
            raceData: raceData,
            currentLapStartTimes: currentLapStartTimes
        } : previousRaceData;

        const now = Date.now();
        Object.keys(dataToUse.currentLapStartTimes).forEach(carNumber => {
            if (dataToUse.raceData[carNumber]) {
                dataToUse.raceData[carNumber].currentLap = 
                    currentRace ? (now - dataToUse.currentLapStartTimes[carNumber]) 
                              : dataToUse.raceData[carNumber].currentLap;
            }
        });

        const sortedDrivers = Object.values(dataToUse.raceData).sort((a, b) => {
            if (!a.bestLap && !b.bestLap) return 0;
            if (!a.bestLap) return 1;
            if (!b.bestLap) return -1;
            return a.bestLap - b.bestLap;
        });

        leaderboardBody.innerHTML = `
            <tr>
                <th>Pos</th>
                <th>Driver</th>
                <th>Car</th>
                <th>Laps</th>
                <th>Current Lap</th>
                <th>Last Lap</th>
                <th>Best Lap</th>
            </tr>
        `;

        sortedDrivers.forEach((driver, index) => {
            const row = document.createElement("tr");
            if (index < 3) row.classList.add(`position-${index + 1}`);

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${driver.name}</td>
                <td>${driver.carAssigned}</td>
                <td>${driver.laps}</td>
                <td>${formatLapTime(driver.currentLap)}</td>
                <td>${formatLapTime(driver.lastLap)}</td>
                <td>${formatLapTime(driver.bestLap)}</td>
            `;
            leaderboardBody.appendChild(row);
        });
    }

    function startUpdateInterval() {
        if (updateInterval) clearInterval(updateInterval);
        updateInterval = setInterval(updateLeaderboard, 100);
    }

    socket.on('activeRace', (race) => {
        if (race && race.active) {
            initLeaderboard(race);
        } else if (previousRaceData) {
            updateLeaderboard();
        }
    });

    socket.on('lapTimeUpdate', (data) => {
        const carNumber = data.carNumber.toString();
        
        if (!raceData[carNumber]) {
            const driver = currentRace?.drivers?.find(d => 
                d.carAssigned === `Car ${carNumber}`);
            if (!driver) return;
            
            raceData[carNumber] = {
                name: driver.name,
                carAssigned: driver.carAssigned,
                laps: 0,
                lastLap: null,
                bestLap: null,
                currentLap: 0
            };
        }

        raceData[carNumber].lastLap = data.lapTime;
        raceData[carNumber].laps = data.lapCount;
        raceData[carNumber].currentLap = 0;
        
        if (!raceData[carNumber].bestLap || data.lapTime < raceData[carNumber].bestLap) {
            raceData[carNumber].bestLap = data.lapTime;
        }
        
        currentLapStartTimes[carNumber] = Date.now();
    });

    socket.on('raceUpdate', (data) => {
		console.log('Race status update:', data);
		raceStatus = data;
		updateFlagDisplay(data.mode);
		
		// Always update the timer display when we get fresh data
		if (data.remainingTime !== undefined) {
			updateTimerDisplay(data.remainingTime);
		}
	
		if (data.mode === "Finished") {
			// Freeze all current lap timers
			const finishTime = Date.now();
			Object.keys(currentLapStartTimes).forEach(carNumber => {
				if (raceData[carNumber]) {
					raceData[carNumber].currentLap = finishTime - currentLapStartTimes[carNumber];
				}
			});
			
			// Save final state
			previousRaceData = {
				raceData: JSON.parse(JSON.stringify(raceData)),
				currentLapStartTimes: JSON.parse(JSON.stringify(currentLapStartTimes)),
				timestamp: finishTime
			};
			
			// Stop updates
			if (updateInterval) {
				clearInterval(updateInterval);
				updateInterval = null;
			}
			if (localTimerInterval) {
				clearInterval(localTimerInterval);
				localTimerInterval = null;
			}
			
			// Force UI update
			updateLeaderboard();
		} else if (data.running && !updateInterval) {
			startUpdateInterval();
		}
	});

    function updateTimerDisplay(seconds) {
		currentRemainingTime = seconds;
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		timerDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
		
		// Start or restart the local countdown
		if (localTimerInterval) clearInterval(localTimerInterval);
		
		if (raceStatus.running && seconds > 0) {
			lastTimerUpdate = Date.now();
			localTimerInterval = setInterval(() => {
				// Calculate time passed since last server update
				const now = Date.now();
				const elapsed = Math.floor((now - lastTimerUpdate) / 1000);
				const remaining = Math.max(0, currentRemainingTime - elapsed);
				
				const mins = Math.floor(remaining / 60);
				const secs = remaining % 60;
				timerDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
				
				if (remaining <= 0) {
					clearInterval(localTimerInterval);
				}
			}, 200); // Update every 200ms for smooth countdown
		}
	}

    function updateFlagDisplay(mode) {
        flagDisplay.className = "flag-display " + 
            (mode === "Safe" ? "flag-green" :
             mode === "Hazard" ? "flag-yellow" :
             mode === "Danger" ? "flag-red" : "flag-finished");
    }

	window.addEventListener('beforeunload', () => {
		if (updateInterval) clearInterval(updateInterval);
		if (localTimerInterval) clearInterval(localTimerInterval);
	});

    socket.emit('getRaces');
});