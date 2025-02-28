// server/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const { clearInterval } = require('timers');  // Module for timer functions

// Race status default values
let raceStatus = {running: false, mode: "Danger", remainingTime: 0};
let timerInterval = null;

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

// Serve static files from the public folder
app.use(express.static('public'));
app.use(express.static('public/race-control'));

app.set("io", io);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Beachside Racetrack System is running!');
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

	// Send a test message to the client (cant test socket.emit until we have the frontend working, so lets hope it works.)
	socket.emit('message', 'Welcome to Beachside Racetrack!');

  // Send initial race status
  socket.emit("raceUpdate", raceStatus);

  // Handle race start event
  socket.on("start", () => {
    if(!raceStatus.running) {
    raceStatus = {running: true, mode: "Safe", remainingTime: process.env.TIMER_DURATION};

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
    }
  });

  // Real time race mode changes
  socket.on("setRaceMode", (mode) => {
    raceStatus.mode = mode;
    io.emit("raceUpdate", raceStatus);  // Send the update to all clients
  });

  // Handle race end event
  socket.on("endRace", () => {
    if(timerInterval) {
      clearInterval(timerInterval); // Stop timer if running
      timerInterval = null;
    }
    raceStatus = {running: false, mode: "Danger", remainingTime: 0};
    io.emit("raceUpdate", raceStatus);  // Send update that the race ended
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
