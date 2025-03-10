// server/server.js
const express = require('express');
const http = require('http');
const {Server} = require('socket.io');
const dotenv = require('dotenv');
const raceRoutes = require('./routes/routes');
const path = require('path');

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

// Socket.IO connection handler
io.on('connection', (socket) => {
  	console.log('A user connected:', socket.id);

	// Send a test message to the client
	socket.emit('message', 'Welcome to Beachside Racetrack!');

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