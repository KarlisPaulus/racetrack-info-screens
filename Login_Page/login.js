const container = document.createElement('div'); // Create a container for the three main buttons
container.className = 'loginContainer';
document.body.appendChild(container);

const loginButton = document.createElement('button'); // CREATE BUTTONS
loginButton.id = 'loginButton';
loginButton.textContent = 'Login';
loginButton.className = 'loginBut';
container.appendChild(loginButton);

const guestButton = document.createElement('button');
guestButton.id = 'guestButton';
guestButton.textContent = 'Guest';
guestButton.className = 'guestBut';
container.appendChild(guestButton);

const driverButton = document.createElement('button');
driverButton.id = 'driverButton';
driverButton.textContent = 'Driver';
driverButton.className = 'driverBut';
container.appendChild(driverButton);

loginButton.addEventListener('click', () => { // EVENT LISTENERS FOR BUTTONS
  promptForAccessKey();
});

guestButton.addEventListener('click', () => {
  window.location.href = '/leader-board';
});

driverButton.addEventListener('click', () => {
  toggleDriverOptions();
});

function promptForAccessKey() { // Prompt for key, send to the server
  const accessKey = prompt("Enter your access key:");
  if (!accessKey) return;
  
  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Send only the access key so the server will decide the correct page.
    body: JSON.stringify({ accessKey })
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.message);
      });
    }
    return response.json();
  })
  .then(data => {
    // Redirect to the page chosen by the server
    window.location.href = data.redirectUrl;
  })
  .catch(err => {
    alert(err.message);
    // re-prompt the user
    promptForAccessKey();
  });
}

// Create/Toggle Driver buttons
function toggleDriverOptions() {
  let driverOptions = document.getElementById('driverOptions');
  if (driverOptions) {

    // Toggle visibility if already created
    driverOptions.style.display = driverOptions.style.display === 'none' ? 'grid' : 'none';
    loginButton.style.display = loginButton.style.display === 'block' ? 'none' : 'block';
    guestButton.style.display = guestButton.style.display === 'block' ? 'none' : 'block';
  } else {
    loginButton.style.display = loginButton.style.display === 'none' ? 'block' : 'none'; // Taggle other buttons
    guestButton.style.display = guestButton.style.display === 'none' ? 'block' : 'none';

    // Create a new container for driver-specific buttons
    driverOptions = document.createElement('div');
    driverOptions.id = 'driverOptions';
    driverOptions.className = 'driverOpt';
    
    const nextRaceBtn = document.createElement('button'); // Make Buttons.
    nextRaceBtn.id = 'nextRace';
    nextRaceBtn.textContent = 'Next Race';
    nextRaceBtn.className = 'nextRace';
    nextRaceBtn.addEventListener('click', () => {
      window.location.href = '/next-race';
    });
    driverOptions.appendChild(nextRaceBtn);
    
    const raceCountdownBtn = document.createElement('button');
    raceCountdownBtn.id = 'raceCountdown';
    raceCountdownBtn.textContent = 'Race Countdown';
    raceCountdownBtn.className = 'raceCount'
    raceCountdownBtn.addEventListener('click', () => {
      window.location.href = '/race-countdown';
    });
    driverOptions.appendChild(raceCountdownBtn);
    
    const raceFlagsBtn = document.createElement('button');
    raceFlagsBtn.id = 'raceFlags';
    raceFlagsBtn.textContent = 'Race Flags';
    raceFlagsBtn.className = 'raceFlags';
    raceFlagsBtn.addEventListener('click', () => {
      window.location.href = '/race-flags';
    });
    driverOptions.appendChild(raceFlagsBtn);
    
    container.appendChild(driverOptions); // Append
  }
}
