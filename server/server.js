// server/server.js
const express = require('express');
const http = require('http');
const {Server} = require('socket.io');
const dotenv = require('dotenv');
const raceRoutes = require('./routes/routes');
const path = require('path');
const { clearInterval } = require('timers');  // Module for timer functions

// Race status default values
const initialTime = process.env.TIMER_DURATION;
let timerInterval = null;
let raceStatus = {running: false, mode: "Danger", remainingTime: 0, timerDuration: initialTime};

// Load environment variables
dotenv.config();

// Check if required environment variables are set
const requiredEnvVars = ['RECEPTIONIST_KEY', 'OBSERVER_KEY', 'SAFETY_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: Missing environment variable ${envVar}`);
    process.exit(1);
  }
}

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Pass the `io` instance to the controller
const raceController = require('./controllers/raceController');
raceController.setIO(io);

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, '/../public')));

app.set("io", io);

// Serve static files from the FrontDesk folder
app.use('/FrontDesk', express.static(path.join(__dirname, '/../public/FrontDesk')));

// Body parser middleware to parse JSON request bodies
app.use(express.json());

// Register raceRoutes
app.use("/api", raceRoutes);

// Serve FrontDesk.html
app.get('/front-desk', (req, res) => {
	res.sendFile(path.join(__dirname, '/../public/FrontDesk/FrontDesk.html'));
  });
  
// Serve NextRace.html
app.get('/next-race', (req, res) => {
    res.sendFile(path.join(__dirname, '/../public/NextRace/NextRace.html'));
});

// Serve RaceControl.html
app.get('/race-control', (req, res) => {
  	res.sendFile(path.join(__dirname, '/../public/raceControl/raceControl.html'));
});

// Serve race-countdown.html
app.get('/race-countdown', (req, res) => {
  	res.sendFile(path.join(__dirname, '/../public/raceCountdown/race-countdown.html'));
});

// Serve race-flags.html
app.get('/race-flags', (req, res) => {
  	res.sendFile(path.join(__dirname, '/../public/raceFlags/race-flags.html'));
});

// Serve lap-line-tracker.html
app.get('/lap-line-tracker', (req, res) => {
	res.sendFile(path.join(__dirname, '/../public/lap-times-employee/lap-times-emp.html'));
});

// Fetch active race ID
app.get('/api/races/active', (req, res) => {
	const activeRace = raceController.getActiveRace();
	if (activeRace) {
	  	res.status(200).json({ activeRaceId: activeRace.id });
	} else {
	  	res.status(404).json({ message: "No active race found." });
	}
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  	console.log('A user connected:', socket.id);

	// Send a test message to the client
	socket.emit('message', 'Welcome to Beachside Racetrack!');

  // Send initial race status
  socket.emit("raceUpdate", raceStatus);

  // Handle race start event
  socket.on("start", () => {
    if(!raceStatus.running) {
    raceStatus = {running: true, mode: "Safe", remainingTime: initialTime, timerDuration: initialTime};

      // Start timer
      timerInterval = setInterval(() => {
        raceStatus.remainingTime--;
        io.emit("timerUpdate", raceStatus.remainingTime);

        // Check if timer is finished
        if (raceStatus.remainingTime <= 0) {
          clearInterval(timerInterval); // Stop timer
          raceStatus = {running: true, mode: "Finished", timerInterval: null};
          io.emit("raceUpdate", raceStatus);  // Send real-time race update
        }
      }, 1000);

     	io.emit("raceUpdate", raceStatus);  // Send update that the race started

    	 // Mark the current race as active
    	const activeRace = raceController.startRace();

    	// Broadcast the active race ID
        if (activeRace) {
            io.emit("activeRaceId", activeRace.id); // Send the active race ID to all clients
        }

        // Inform clients that the race session has started
        io.emit("racesList", raceController.getRaces());
  	}
  });

  // Real time race mode changes
  socket.on("setRaceMode", (mode) => {
    raceStatus.mode = mode;
    if (raceStatus.mode === "Finished") {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    io.emit("raceUpdate", raceStatus);  // Send the update to all clients
  });

  // Handle race end event
  socket.on("endRace", () => {
    if(timerInterval) {
      clearInterval(timerInterval); // Stop timer if running
      timerInterval = null;
    }
    raceStatus = {running: false, mode: "Danger", remainingTime: 0, timerDuration: initialTime};

	// Get the active race
    const activeRace = raceController.getActiveRace();
    if (activeRace) {
        const raceId = activeRace.id; // Get the raceId
        raceController.deleteRace(raceId); // Pass the raceId to deleteRace
    }

    // Emit the updated race status and races list
    io.emit("raceUpdate", raceStatus);
    io.emit("racesList", raceController.getRaces()); // Emit the updated list of races
  });

  	socket.on('disconnect', () => {
    	console.log('User disconnected:', socket.id);
  	});

  	// Listen for race updates
  	socket.on('updateRace', (race) => {
    	io.emit('raceUpdated', race);
  	});

  	// Listen for new race creation
  	socket.on('newRace', (race) => {
    	io.emit('raceCreated', race);
  	});

  	// Listen for race deletion
  	socket.on('deleteRace', (raceId) => {
    	io.emit('raceDeleted', raceId);
  	});

	// Listen for requests to get the list of races
    socket.on('getRaces', () => {
        const races = require('./controllers/raceController').getRaces();
        socket.emit('racesList', races);
    });
});
// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
