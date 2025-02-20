const socket = io();
let finished = false;

// racemodes parent div
const raceModes = document.createElement("div");
raceModes.classList.add("raceModes");

// Start race button
const startRaceButton = document.createElement("div");
startRaceButton.classList.add("startRace");
startRaceButton.textContent = "Start Race";
startRaceButton.addEventListener("click", () => {
    socket.emit("start");
    startRaceButton.remove();
    document.body.append(raceModes);
});
document.body.append(startRaceButton);

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
    raceModes.remove();
    document.body.append(endRaceButton);
});
raceModes.appendChild(finish);

// Function for setting race modes
function setRaceMode(mode) {
    socket.emit("setRaceMode", mode);
};

// Listens for updates from the server
socket.on("raceUpdate", (data) => {
    console.log(`Race mode updated to ${data.mode}`);
});