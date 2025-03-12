// Initialize real-time connection
const socket = io();

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

// Create full screen button
const fullScreenButton = document.createElement("div");
fullScreenButton.classList.add("fullScreenButton");
fullScreenButton.textContent = "Fullscreen";
document.body.append(fullScreenButton);

// Click event listener
fullScreenButton.addEventListener("click", () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
            fullScreenButton.style.display = "none";    // Hide button when in fullscreen
    }
});

// Listen for fullscreen changes
document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
        fullScreenButton.style.display = "block";   // Show button
    }
});

