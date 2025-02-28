// Initialize real-time connection
const socket = io();

// racemodes parent div
const raceModes = document.createElement("div");
raceModes.classList.add("raceModes");

// Timer element
const timer = document.createElement("div");
timer.classList.add("timer");

// Start race button
const startRaceButton = document.createElement("div");
startRaceButton.classList.add("startRace");
startRaceButton.textContent = "Start Race";
startRaceButton.addEventListener("click", () => {
    socket.emit("start");   // sends to server
});

// End race button
const endRaceButton = document.createElement("div");
endRaceButton.classList.add("endRace");
endRaceButton.textContent = "End Race";
endRaceButton.addEventListener("click", () => {
    socket.emit("endRace");
});

// Safe mode button
const safe = document.createElement("div");
safe.classList.add("safe");
safe.textContent = "Safe";
safe.addEventListener("click", () => {
    setRaceMode("Safe");
});
raceModes.appendChild(safe);

// Hazard mode button
const hazard = document.createElement("div");
hazard.classList.add("hazard");
hazard.textContent = "Hazard";
hazard.addEventListener("click", () => {
    setRaceMode("Hazard");
});
raceModes.appendChild(hazard);

// Danger mode button
const danger = document.createElement("div");
danger.classList.add("danger");
danger.textContent = "Danger";
danger.addEventListener("click", () => {
    setRaceMode("Danger");
});
raceModes.appendChild(danger);

// Finish mode button
const finish = document.createElement("div");
finish.classList.add("finish");
finish.textContent = "Finish";
finish.addEventListener("click", () => {
    setRaceMode("Finished");
});
raceModes.appendChild(finish);

// Function for setting race modes
function setRaceMode(mode) {
    socket.emit("setRaceMode", mode);
};

// Function for changing buttons colors according to race modes
function raceModeColor(color) {
    document.querySelectorAll(".raceModes div").forEach(button => {
        button.classList.remove("active");
    });
    if (color === "Safe") {
        safe.classList.add("active");
    } else if (color === "Hazard") {
        hazard.classList.add("active");
    } else if (color === "Danger") {
        danger.classList.add("active");
    }
}

// Next race session element..... To be continued
const nextRaceSess = document.createElement("div");
nextRaceSess.classList.add("nextRaceSession");
nextRaceSess.textContent = "Next race session:";

// Listens for updates from the server
socket.on("raceUpdate", (data) => {  
    console.log(`Race mode updated to ${data.mode}, running: ${data.running}`);

    // When start race is clicked and timer isn't displayed yet
    if (!document.body.contains(timer) && data.remainingTime > 0 && document.body.contains(startRaceButton)) {
        startRaceButton.remove();
        nextRaceSess.remove();
        document.body.append(raceModes); 
        document.body.append(timer);

        // Sets timer display to initial time
        if (data.remainingTime === "600") {
            timer.textContent = "10:00";
        } else {
            timer.textContent = "01:00";
        }
    }

    // Case when end race is clicked, adds start race screen
    else if (!data.running && data.mode === "Danger") {
        endRaceButton.remove();
        document.body.append(nextRaceSess);
        document.body.append(startRaceButton);
    }

   // If the race is "Finished", transition to finished state
    else if (data.mode === "Finished") {
        timer.remove();
        raceModes.remove();
        startRaceButton.remove();
        nextRaceSess.remove();
        document.body.append(endRaceButton);
    }

    // Edge case when race is running. Fixes blank screen when refreshing page
    else if (data.running) {
        document.body.append(raceModes);
        document.body.append(timer);
    }

    // Clear timer display when race is not running
    if (data.remainingTime === 0 && !data.running) {
        timer.textContent = "";
    }

    // Update button colors
    raceModeColor(data.mode);
});

// Real time timer updates from the server
socket.on("timerUpdate", (remainingTime) => {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    // Add leading zero if smaller than 10
    let formattedTime =
    (minutes < 10 ? "0" + minutes : minutes) + ":" + 
    (seconds < 10 ? "0" + seconds : seconds);
    timer.textContent = formattedTime;
});