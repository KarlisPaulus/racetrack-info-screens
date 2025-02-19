const lapTimersContainer = document.getElementById('lapTimersContainer');

// store references to each row's time display <p> element
const timeDisplays = [];

for (let i = 0; i < 8; i++) {
  //Create a row container
  const row = document.createElement('div');
  row.className = 'carRow';

  //Create <p> for times
  const timeDisplay = document.createElement('p');
  timeDisplay.className = 'carTimeDisplay';
  timeDisplay.textContent = `Car ${i + 1} last lap: N/A | Best lap: N/A`;
  timeDisplays.push(timeDisplay);

  //Make car buttons
  const newCarButton = document.createElement('button');
  newCarButton.textContent = `Car ${i + 1}`;
  newCarButton.className = 'carButton';

  //Append the <p> and <button> to row
  row.appendChild(timeDisplay);
  row.appendChild(newCarButton);

  //Append the row to the container
  lapTimersContainer.appendChild(row);

  
  newCarButton.addEventListener('click', () => { //click event for lap timing
    if (!newCarButton.dataset.startTime) { // If first click, store the start time
      newCarButton.dataset.startTime = Date.now();
    } else {
      // Subsequent clicks: calculate the lap time
      const lapTime = Date.now() - parseInt(newCarButton.dataset.startTime);
      const formattedLap = formatLapTime(lapTime);

      
      if (!newCarButton.dataset.bestLap) { // If no best lap, set this as the best
        newCarButton.dataset.bestLap = lapTime;
      } else {
        // Compare current lap to best lap
        const bestLap = parseInt(newCarButton.dataset.bestLap);
        if (lapTime < bestLap) {
          newCarButton.dataset.bestLap = lapTime;
        }
      }

      // Update the time display text
      const bestLapTime = parseInt(newCarButton.dataset.bestLap);
      const formattedBest = formatLapTime(bestLapTime);
      timeDisplay.textContent = 
        `Car ${i + 1} last lap: ${formattedLap} | Best lap: ${formattedBest}`;

      // Reset for next lap
      newCarButton.dataset.startTime = Date.now();
    }
  });
}

const endRaceButton = document.createElement('button'); // End race button
  endRaceButton.textContent = 'End Race';
  endRaceButton.className = 'endRaceButton';
  document.body.appendChild(endRaceButton);
endRaceButton.addEventListener('click', () =>{
  // To be continued! :0
});

function formatLapTime(timeInMs) {
  const minutes = Math.floor(timeInMs / 60000);
  const seconds = Math.floor((timeInMs % 60000) / 1000);
  const milliseconds = timeInMs % 1000;

  const formattedSeconds = seconds < 10 ? '0' + seconds : seconds;
  const formattedMilliseconds = milliseconds.toString().padStart(3, '0');

  return `${minutes}:${formattedSeconds}:${formattedMilliseconds}`;
}