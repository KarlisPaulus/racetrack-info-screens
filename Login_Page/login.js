const loginContainer = document.createElement('div'); // Make a box to put options in
    loginContainer.className = 'loginContainer';
    document.body.appendChild(loginContainer);
const spectator = document.createElement('button'); // Spectator button
    spectator.className = 'spectator';
    spectator.id = 'spectator';
    spectator.textContent = 'Spectator';
    loginContainer.appendChild(spectator);
const laptimer = document.createElement('button'); // Lap timer button
    laptimer.className = 'lapTimer';
    laptimer.id = 'lapTimer';
    laptimer.textContent = 'Lap Timer';
    loginContainer.appendChild(laptimer);
const raceControl = document.createElement('button'); // Race Control button
    raceControl.className = 'raceControl';
    raceControl.id = 'raceControl';
    raceControl.textContent = 'Race Control';
    loginContainer.appendChild(raceControl);
const raceManagement = document.createElement('button'); // Race Management button
    raceManagement.className = 'raceManagement';
    raceManagement.id = 'raceManagement';
    raceManagement.textContent = 'Race Management';
    loginContainer.appendChild(raceManagement);



