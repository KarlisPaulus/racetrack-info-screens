// server/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const raceRoutes = require('./routes/routes');
const path = require('path');
const session = require('express-session');

// Load environment variables from .env
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

// Set up session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultSessionSecret', // Ideally set SESSION_SECRET in your .env file too
  resave: false,
  saveUninitialized: false,
}));

// Parse URL-encoded bodies (for form submissions) and JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Pass the `io` instance to the controller
const raceController = require('./controllers/raceController');
raceController.setIO(io);

// OPTIONAL: Serve static files (FrontDesk, etc.)
// If you have an index.html in /FrontDesk, it could conflict with the root route below.
// So keep this if you still need to serve files from /FrontDesk at other paths.
app.use(express.static(path.join(__dirname, '/../public/FrontDesk')));

// ------------------------------------------------------------------
// Serve login.html as the MAIN PAGE (root path "/")
// ------------------------------------------------------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/../public/Login_Page/login.html'));
});

// ------------------------------------------------------------------
// LOGIN ENDPOINT
// Receives an access key and desired page, verifies it, then sets session.
// ------------------------------------------------------------------
app.post('/login', (req, res) => {
  const { accessKey } = req.body;
  let redirectUrl = null;
  
  if (accessKey === process.env.RECEPTIONIST_KEY) {
    req.session.authenticated = true;
    req.session.role = 'receptionist';
    redirectUrl = '/front-desk';
  } else if (accessKey === process.env.OBSERVER_KEY) {
    req.session.authenticated = true;
    req.session.role = 'observer';
    redirectUrl = '/lap-line-tracker';
  } else if (accessKey === process.env.SAFETY_KEY) {
    req.session.authenticated = true;
    req.session.role = 'safety';
    redirectUrl = '/race-control';
  }
  
  if (redirectUrl) {
    res.json({ redirectUrl });
  } else {
    setTimeout(() => {
      res.status(401).json({ message: 'Invalid access key' });
    }, 500);
  }
});

// ------------------------------------------------------------------
// AUTH MIDDLEWARE
// Protects routes by checking for a valid session.
// ------------------------------------------------------------------
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    next();
  } else {
    // Redirect to the login page if not authenticated
    res.redirect('/');
  }
}

// ------------------------------------------------------------------
// PROTECTED ROUTES
// Only accessible if authenticated (via requireAuth).
// ------------------------------------------------------------------
app.get('/lap-line-tracker', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '/../public/LapLineTracker/lap-line-tracker.html'));
});

app.get('/race-control', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '/../public/RaceControl/race-control.html'));
});

app.get('/front-desk', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '/../public/FrontDesk/front-desk.html'));
});

// ------------------------------------------------------------------
// OTHER ROUTES (Public displays, etc)
// ------------------------------------------------------------------
app.use("/api", raceRoutes);

app.get('/leader-board', (req, res) => {
  res.sendFile(path.join(__dirname, '/../public/Spectator/leader-board.html'));
});

app.get('/next-race', (req, res) => {
  res.sendFile(path.join(__dirname, '/../public/RaceDriver/next-race.html'));
});

app.get('/race-countdown', (req, res) => {
  res.sendFile(path.join(__dirname, '/../public/RaceDriver/race-countdown.html'));
});

app.get('/race-flags', (req, res) => {
  res.sendFile(path.join(__dirname, '/../public/RaceDriver/race-flags.html'));
});

// ------------------------------------------------------------------
// SOCKET.IO SETUP
// ------------------------------------------------------------------
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

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
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
