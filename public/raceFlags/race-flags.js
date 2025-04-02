// Initialize real-time connection
const socket = io();

const fullscreenButton = document.getElementById('fullscreenButton');
const exitFullscreenButton = document.getElementById('exitFullscreenButton');

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

// Create flag element
const flag = document.createElement("div");
flag.classList.add("flag");

// Real time connection for flag display
socket.on("raceUpdate", (data) => {
    flag.className = "flag";    // Resets flag class on every update

    if (data.mode === "Safe") {
        flag.style.backgroundColor = "green";
    } else if (data.mode === "Hazard") {
        flag.style.backgroundColor = "yellow";
    } else if (data.mode === "Danger") {
        flag.style.backgroundColor = "red";
    } else if (data.mode === "Finished") {
        flag.classList.add("finished");
    }
    document.body.append(flag);
});

