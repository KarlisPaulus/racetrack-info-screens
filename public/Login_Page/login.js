// Find the wrapper container
const wrapper = document.querySelector('.wrapper') || document.body;

// Create a container for the three main buttons
const container = document.createElement('div');
container.className = 'loginContainer';
wrapper.appendChild(container);

const loginButton = document.createElement('button');
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

loginButton.addEventListener('click', () => {
  promptForAccessKey();
});

guestButton.addEventListener('click', () => {
  window.location.href = '/leader-board';
});

driverButton.addEventListener('click', () => {
  toggleDriverOptions();
});

function promptForAccessKey() {
  const accessKey = prompt("Enter your access key:");
  if (!accessKey) return;
  
  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    window.location.href = data.redirectUrl;
  })
  .catch(err => {
    alert(err.message);
    promptForAccessKey();
  });
}

function toggleDriverOptions() {
  let driverOptions = document.getElementById('driverOptions');
  if (driverOptions) {
    // Toggle display based on current state.
    if (driverOptions.style.display === 'grid') {
      driverOptions.style.display = 'none';
      loginButton.style.display = 'block';
      guestButton.style.display = 'block';
      // Remove the "active" class so CSS hover/active styles take over.
      driverButton.classList.remove('active');
      driverButton.textContent = 'Driver';
    } else {
      driverOptions.style.display = 'grid';
      loginButton.style.display = 'none';
      guestButton.style.display = 'none';
      driverButton.classList.add('active');
      driverButton.textContent = 'Back';
    }
  } else {
    // When driverOptions don't exist, create them and add the active class.
    loginButton.style.display = 'none';
    guestButton.style.display = 'none';
    driverButton.textContent = 'Back';
    driverButton.classList.add('active');

    driverOptions = document.createElement('div');
    driverOptions.id = 'driverOptions';
    driverOptions.className = 'driverOpt';
    driverOptions.style.display = 'grid';
    
    const nextRaceBtn = document.createElement('button');
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
    raceCountdownBtn.className = 'raceCount';
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
    
    container.appendChild(driverOptions);
  }
}
