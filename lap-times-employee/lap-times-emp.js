const lapTimersContainer = document.getElementById('lapTimersContainer');

// store references to each row's time display <p> element
const timeDisplays = [];

  for (let i = 0; i < 8; i++) {
    // Create a row container
    const row = document.createElement('div');
    row.className = 'carRow';
  
    // Create <p> for times
    const timeDisplay = document.createElement('p');
    timeDisplay.className = 'carTimeDisplay';
    timeDisplay.textContent = `Car ${i + 1} last lap: N/A | Best lap: N/A`;
  
    // Make car button(s)
    const newCarButton = document.createElement('button');
    newCarButton.textContent = `Car ${i + 1}`;
    newCarButton.className = 'carButton';
    newCarButton.id = `Car ${i + 1}`;
  
    // Attach properties so lapTimer can access them
    newCarButton.myTimeDisplay = timeDisplay;
    newCarButton.carNumber = i + 1;
  
    // Append the <p> and <button> to row and row to box
    row.appendChild(timeDisplay);
    row.appendChild(newCarButton);
    lapTimersContainer.appendChild(row);
  
    
    newCarButton.addEventListener('click', lapTimer); //click event for lap timing
  }

function lapTimer(event) { // Lap Timer
  const newCarButton = event.currentTarget;
  const timeDisplay = newCarButton.myTimeDisplay;
  const carNumber = newCarButton.carNumber;

  if (!newCarButton.dataset.startTime) { // If first click, store the start time
    newCarButton.dataset.startTime = Date.now();
  } else {
    const lapTime = Date.now() - parseInt(newCarButton.dataset.startTime); // Subsequent clicks: calculate the lap time
    const formattedLap = formatLapTime(lapTime);

    if (!newCarButton.dataset.bestLap) { // If no best lap, set this as the best
      newCarButton.dataset.bestLap = lapTime;
    } else {
      const bestLap = parseInt(newCarButton.dataset.bestLap);
      if (lapTime < bestLap) { // Compare current lap to best lap
        newCarButton.dataset.bestLap = lapTime;
      }
    }

    const bestLapTime = parseInt(newCarButton.dataset.bestLap);
    const formattedBest = formatLapTime(bestLapTime);
    timeDisplay.textContent = `Car ${carNumber} last lap: ${formattedLap} | Best lap: ${formattedBest}`; // Update the time display text

    newCarButton.dataset.startTime = Date.now(); // Reset for next lap
    
    socket.emit('lapTime', { // Emit the lap time data with socket.io
      carNumber: carNumber,
      lapTime: lapTime,
      formattedLap: formattedLap,
      bestLap: bestLapTime,
      formattedBest: formattedBest
    });
  }
}

function formatLapTime(timeInMs) {
  const minutes = Math.floor(timeInMs / 60000);
  const seconds = Math.floor((timeInMs % 60000) / 1000);
  const milliseconds = timeInMs % 1000;

  const formattedSeconds = seconds < 10 ? '0' + seconds : seconds;
  const formattedMilliseconds = milliseconds.toString().padStart(3, '0');

  return `${minutes}:${formattedSeconds}:${formattedMilliseconds}`;
}

const endRaceButton = document.createElement('button'); // End race button
  endRaceButton.textContent = 'End Race';
  endRaceButton.className = 'endRaceButton';
  document.body.appendChild(endRaceButton);

endRaceButton.addEventListener('click', () =>{
  endRaceButton.style.backgroundColor = "gray";
  endRaceButton.textContent = 'Race Ended';

  for (let i = 0; i < 8; i++) {
    const carButton = document.getElementById(`Car ${i + 1}`);
    carButton.removeEventListener('click', lapTimer);
    carButton.style.backgroundColor = "gray";
}});

const fullscreenButton = document.createElement('button'); // Add fullscreen button**********
  fullscreenButton.className = "fullscreenButton";
  fullscreenButton.addEventListener('click', () =>{ 
    document.documentElement.requestFullscreen();
  });
document.body.appendChild(fullscreenButton); // Append

const exitFullscreenButton = document.createElement('button'); // Add Exitfullscreen button
  exitFullscreenButton.className = "exitFullscreenButton";
  exitFullscreenButton.addEventListener('click', () => {
    document.exitFullscreen();
  })
document.body.appendChild(exitFullscreenButton); // Append

exitFullscreenButton.style.display = 'none'; // Hide exitButton

document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) { // Currently in fullscreen
    fullscreenButton.style.display = 'none';
    exitFullscreenButton.style.display = 'inline-block';
  } else { // Not in fullscreen
    fullscreenButton.style.display = 'inline-block';
    exitFullscreenButton.style.display = 'none';
  }
});

const darkModeButton = document.createElement('button'); // Create Darkmode Button
  darkModeButton.className = "darkModeButton";

  const lightModeButton = document.createElement('button'); // Create LightMode Button
    lightModeButton.className = "lightModeButton";
    lightModeButton.style.display = 'none';
    
darkModeButton.addEventListener('click', () =>{ // Switch to DarkMode
    document.body.style.backgroundColor = "black";
    lapTimersContainer.style.backgroundColor = "black";
    const rows = lapTimersContainer.querySelectorAll('.carRow');
    rows.forEach(row => {
      row.style.backgroundColor = "rgb(43, 43, 43)";
      row.style.color = "white";
    });
    darkModeButton.style.display = 'none'; // If switch to dark, remove Dark button
    lightModeButton.style.display = 'inline-block'; // And add Light button
});

lightModeButton.addEventListener('click', () =>{ // Switch to LightMode
    document.body.style.backgroundColor = "rgb(175, 175, 175)";
    lapTimersContainer.style.backgroundColor = "rgb(175, 175, 175)";
    const rows = lapTimersContainer.querySelectorAll('.carRow');
    rows.forEach(row => {
      row.style.backgroundColor = "white";
      row.style.color = "#000000";
    });
    lightModeButton.style.display = 'none'; // If switch to light, remove Light button
    darkModeButton.style.display = 'inline-block'; // And add Dark button
});

document.body.appendChild(darkModeButton); // Append buttons
document.body.appendChild(lightModeButton);