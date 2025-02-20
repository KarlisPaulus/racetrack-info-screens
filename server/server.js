// server/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

// Race status default values
let raceStatus = {running: false, mode: "Danger"};

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
    raceStatus = {running: true, mode: "Safe"};
    io.emit("raceUpdate", raceStatus);
  });

  // Real time race mode changes
  socket.on("setRaceMode", (mode) => {
    raceStatus.mode = mode;
    io.emit("raceUpdate", raceStatus);  // Sends the update to all clients
  });

  // Handle race end event
  socket.on("endRace", () => {
    raceStatus = {running: false, mode: "Danger"};
    io.emit("raceUpdate", raceStatus);
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