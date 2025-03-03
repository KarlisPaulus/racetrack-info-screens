const socket = io();

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