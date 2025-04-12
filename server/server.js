// server/server.js

//---------------------------------------------------
// 1) Imports and basic setup
//---------------------------------------------------
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const session = require('express-session');  // <-- ADDED from SECONDARY
const raceRoutes = require('./routes/routes');
const path = require('path');
const { clearInterval } = require('timers');  // For timer functions
const { initDB, RaceStatus } = require('../db/database');

// Race status default values
const initialTime = process.env.TIMER_DURATION;
let timerInterval = null;
let raceStatus = { running: false, mode: "Danger", remainingTime: 0, timerDuration: initialTime };
let startedRace = null;

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

//---------------------------------------------------
// 2) Create Express app and HTTP server
//---------------------------------------------------
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
  transports: ['websocket'] // enforce WebSocket
});

//---------------------------------------------------
// 3) Session middleware & body parsing
//---------------------------------------------------
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultSessionSecret',
  resave: false,
  saveUninitialized: false,
}));

// Parse URL-encoded bodies (for login form)
app.use(express.urlencoded({ extended: true }));
// Parse JSON bodies
app.use(express.json());

//---------------------------------------------------
// 4) Race controller & Socket.IO references
//---------------------------------------------------
const raceController = require('./controllers/raceController');
raceController.setIO(io);

//---------------------------------------------------
// 5) Define Authentication and Role Middleware
//---------------------------------------------------
// General authentication middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  } else {
    return res.redirect('/');
  }
}

// Role-based middleware: only allow access if user has the correct role
function requireRole(role) {
  return function(req, res, next) {
    if (req.session && req.session.authenticated && req.session.role === role) {
      return next();
    } else {
      return res.redirect('/');
    }
  }
}

//---------------------------------------------------
// 6) Serve static files and login page
//---------------------------------------------------
// Serve the main public folder (unprotected)
app.use(express.static(path.join(__dirname, '/../public')));

// Direct to the login page at the root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/../public/Login_Page/login.html'));
});

// Protect the FrontDesk static files with role-based middleware (assuming FrontDesk is for receptionists)
app.use('/FrontDesk', requireRole('receptionist'), express.static(path.join(__dirname, '/../public/FrontDesk')));

//---------------------------------------------------
// 7) Login routes
//---------------------------------------------------

// a) Serve login.html at the root (redundant with the above GET, can be removed if desired)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/../public/Login_Page/login.html'));
});

// b) LOGIN endpoint
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
    // Small delay to mimic real login feedback
    setTimeout(() => {
      res.status(401).json({ message: 'Invalid access key' });
    }, 500);
  }
});

//---------------------------------------------------
// 8) Protected routes (GET)
//---------------------------------------------------

// Only receptionists can access the FrontDesk page
app.get('/front-desk', requireRole('receptionist'), (req, res) => {
  res.sendFile(path.join(__dirname, '/../public/FrontDesk/FrontDesk.html'));
});

// Only safety users can access the RaceControl page
app.get('/race-control', requireRole('safety'), (req, res) => {
  res.sendFile(path.join(__dirname, '/../public/raceControl/raceControl.html'));
});

// Only observers can access the lap-line-tracker page
app.get('/lap-line-tracker', requireRole('observer'), (req, res) => {
  res.sendFile(path.join(__dirname, '/../public/lap-line-tracker/lap-line-tracker.html'));
});

//---------------------------------------------------
// 9) Public routes (GET)
//---------------------------------------------------

// Serve NextRace.html
app.get('/next-race', (req, res) => {
  res.sendFile(path.join(__dirname, '/../public/NextRace/NextRace.html'));
});

// Serve race-countdown.html
app.get('/race-countdown', (req, res) => {
  res.sendFile(path.join(__dirname, '/../public/raceCountdown/race-countdown.html'));
});

// Serve race-flags.html
app.get('/race-flags', (req, res) => {
  res.sendFile(path.join(__dirname, '/../public/raceFlags/race-flags.html'));
});

// Register raceRoutes
app.use("/api", raceRoutes);

// Serve leader-board.html
app.get('/leader-board', (req, res) => {
  res.sendFile(path.join(__dirname, '/../public/Leaderboard/leader-board.html'));
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

//---------------------------------------------------
// 10) Load and Save Race Status
//---------------------------------------------------

// Load race status on server start
const loadRaceStatus = async () => {
  const status = await RaceStatus.findOne();
  if (status) {
    raceStatus = {
      running: status.running,
      mode: status.mode,
      remainingTime: status.remainingTime,
      timerDuration: status.timerDuration,
    };

    // Automatically resume timer if race is running and time is left
    if (raceStatus.running && raceStatus.remainingTime > 0) {
      startCountdown();
    }

    // Reload the active race and emit it to clients
    startedRace = await raceController.getActiveRace();
    if (startedRace) {
      io.emit("activeRace", startedRace);
    }

  } else {
    // Initialize default race status
    await RaceStatus.create(raceStatus);
  }
};

// Save race status whenever it changes
const saveRaceStatus = async () => {
  const status = await RaceStatus.findOne();
  if (status) {
    status.running = raceStatus.running;
    status.mode = raceStatus.mode;
    status.remainingTime = raceStatus.remainingTime;
    status.timerDuration = raceStatus.timerDuration;
    await status.save();
  }
};

// Function to start the countdown timer
const startCountdown = () => {
  if (timerInterval) clearInterval(timerInterval); // Clear any existing timer

  timerInterval = setInterval(async () => {
    raceStatus.remainingTime--;
    io.emit("timerUpdate", raceStatus.remainingTime);

    // Save the updated race status
    await saveRaceStatus();

    if (raceStatus.remainingTime <= 0) {
      clearInterval(timerInterval); // Stop timer
      raceStatus = { running: true, mode: "Finished", timerDuration: initialTime, timerInterval: null };
      io.emit("raceUpdate", raceStatus); // Send real-time race update

      await saveRaceStatus();
    }
  }, 1000);
};

//---------------------------------------------------
// 11) Race/timer logic & Socket.IO events
//---------------------------------------------------

// Socket.IO connection
io.on('connection', async (socket) => {
  console.log('A user connected:', socket.id);

  socket.emit("racesList", await raceController.getRaces());

  // Send a test message
  socket.emit('message', 'Welcome to Beachside Racetrack!');

  // Send initial race status
  socket.emit("raceUpdate", raceStatus);

  // Emit the active race with lap times
  startedRace = await raceController.getActiveRace();
  socket.emit("activeRace", startedRace);

  if (raceStatus.running && raceStatus.remainingTime > 0) {
    socket.emit("timerUpdate", raceStatus.remainingTime);
  }

  // Handle race start event
  socket.on("start", async () => {
    if (!raceStatus.running) {
      raceStatus = {
        running: true,
        mode: "Safe",
        remainingTime: initialTime,
        timerDuration: initialTime
      };

      // Save race status
      await saveRaceStatus();

      // Start countdown
      startCountdown();

      io.emit("raceUpdate", raceStatus);

    	// Mark the current race as active
    	startedRace = await raceController.startRace();

      // Broadcast the active race
      if (startedRace) {
        io.emit("activeRace", startedRace);
      }

        // Inform clients that the race session has started
        io.emit("racesList", await raceController.getRaces());
  	}
  });

  // Real-time race mode changes
  socket.on("setRaceMode", async (mode) => {
    raceStatus.mode = mode;
    if (mode === "Finished") {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    io.emit("raceUpdate", raceStatus);

    await saveRaceStatus();
  });

  // Handle race end
  socket.on("endRace", async () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    raceStatus = {
      running: false,
      mode: "Danger",
      remainingTime: 0,
      timerDuration: initialTime
    };

    // Get the active race, delete it if any
    const activeRace = await raceController.getActiveRace();
    if (activeRace) {
      const raceId = activeRace.id;
      const result = await raceController.deleteRace(raceId);
      console.log(result.message);
    } else {
      console.error("No active race found to delete.")
    }
    
    startedRace = null;
    io.emit("raceUpdate", raceStatus);

    await saveRaceStatus();
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  // Additional race-related socket events
  socket.on('updateRace', (race) => {
    io.emit('raceUpdated', race);
  });

  socket.on('newRace', (race) => {
    io.emit('raceCreated', race);
  });

  socket.on('deleteRace', (raceId) => {
    io.emit('raceDeleted', raceId);
  });

	// Listen for requests to get the list of races
  socket.on('getRaces', async () => {
      const races = await raceController.getRaces();
      socket.emit('racesList', races);
  });

	socket.on('saveLapTime', async (lapData) => {
    try {
        // Call the saveLapTime function from raceController
        const result = await raceController.saveLapTime({
            params: { id: lapData.raceId }, // Pass the race ID as a parameter
            body: lapData // Pass the lap data as the request body
        }, {
            status: (code) => ({
                json: (data) => console.log(`Response [${code}]:`, data)
            })
        });
    } catch (error) {
        console.error('Error saving lap time:', error);
    }
  });
});

//---------------------------------------------------
// 12) Start the server
//---------------------------------------------------
(async () => {
  await initDB(); // Initialize the database
  await loadRaceStatus(); // Load race status from the database

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
})();
