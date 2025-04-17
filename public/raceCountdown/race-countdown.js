const socket = io(window.location.origin, {
  transports: ['websocket'] // force WebSocket only
});

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

const timer = document.createElement("div");
timer.classList.add("timer");

socket.on("raceUpdate", (data) => {
    if (data.mode === "Finished") {
        timer.textContent = "00:00";
    }
    // Start page
    if (!data.running) {
        if (data.timerDuration === "600") {
            timer.textContent = "10:00";
        } else {
            timer.textContent = "01:00";
        }
    }
});
   
socket.on("timerUpdate", (remainingTime)=> {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    // Add leading zero if smaller than 10
    let formattedTime =
    (minutes < 10 ? "0" + minutes : minutes) + ":" + 
    (seconds < 10 ? "0" + seconds : seconds);
    timer.textContent = formattedTime;
});

document.body.append(timer);