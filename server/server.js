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

//---------------------------------------------------
// 2) Create Express app and HTTP server
//---------------------------------------------------
const app = express();
const server = http.createServer(app);
const io = new Server(server);


//---------------------------------------------------
// 3) Session middleware & body parsing
//---------------------------------------------------
// (ADDED from SECONDARY FILE)
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultSessionSecret',
  resave: false,
  saveUninitialized: false,
}));

// Parse URL-encoded bodies (for login form) - ADDED
app.use(express.urlencoded({ extended: true }));
// We already parse JSON in the main file, keep it:
app.use(express.json());

//---------------------------------------------------
// 4) Race controller & Socket.IO references
//---------------------------------------------------
const raceController = require('./controllers/raceController');
raceController.setIO(io);

//---------------------------------------------------
// 5) Serve static files
//---------------------------------------------------
// Main public folder
app.use(express.static(path.join(__dirname, '/../public')));
//Direct to the login page
app.get('/', (req, res) => {
  // Adjust the path to match where your login.html is actually located
  res.sendFile(path.join(__dirname, '../public/Login_Page/login.html'));
});
// Keep existing FrontDesk static serving:
app.use('/FrontDesk', express.static(path.join(__dirname, '/../public/FrontDesk')));

//---------------------------------------------------
// 6) Login things from SECONDARY FILE
//---------------------------------------------------

// a) Serve login.html at the root ("/")
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

// c) Auth middleware (optional usage)
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  } else {
    // Redirect to the login page if not authenticated
    return res.redirect('/');
  }
}

//---------------------------------------------------
// 7) Existing routes from MAIN FILE
//---------------------------------------------------

// If you want to protect these pages behind login, wrap them with `requireAuth`.
// For example: 
// app.get('/front-desk', requireAuth, (req, res) => { ... })



//---------------------------------------------------
// PROTECTED ROUTES
//---------------------------------------------------
// Serve FrontDesk.html
app.get('/front-desk', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '/../public/FrontDesk/FrontDesk.html'));
});

// Serve RaceControl.html
app.get('/race-control', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '/../public/raceControl/raceControl.html'));
});

// Serve lap-line-tracker.html
app.get('/lap-line-tracker', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '/../public/lap-times-employee/lap-times-emp.html'));
});


//---------------------------------------------------
// PUBLIC ROUTES
//---------------------------------------------------
// Serve NextRace.html
app.get('/next-race', (req, res) => {
  res.sendFile(path.join(__dirname, '/../public/NextRace/NextRace.html'));
});

// Serve race-countdown.html
app.get('/race-countdown', (req, res) => {
  res.sendFile(path.join(__dirname, '/../public/raceCountdown/race-countdown.html'));
});

// Serve leader-board.html
app.get('/leader-board', (req, res) => {
  res.sendFile(path.join(__dirname, '/../public/Spectator/leader-board.html'));
});

// Serve race-flags.html
app.get('/race-flags', (req, res) => {
  res.sendFile(path.join(__dirname, '/../public/raceFlags/race-flags.html'));
});

// Register raceRoutes
app.use("/api", raceRoutes);

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
// 8) Race/timer logic & Socket.IO events (from MAIN FILE)
//---------------------------------------------------

// Race status default values
const initialTime = process.env.TIMER_DURATION;
let timerInterval = null;
let raceStatus = {
  running: false,
  mode: "Danger",
  remainingTime: 0,
  timerDuration: initialTime
};

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Send a test message
  socket.emit('message', 'Welcome to Beachside Racetrack!');

  // Send initial race status
  socket.emit("raceUpdate", raceStatus);

  // Handle race start
  socket.on("start", () => {
    if (!raceStatus.running) {
      raceStatus = {
        running: true,
        mode: "Safe",
        remainingTime: initialTime,
        timerDuration: initialTime
      };

      // Start countdown
      timerInterval = setInterval(() => {
        raceStatus.remainingTime--;
        io.emit("timerUpdate", raceStatus.remainingTime);

        if (raceStatus.remainingTime <= 0) {
          clearInterval(timerInterval);
          raceStatus = { running: true, mode: "Finished", timerInterval: null };
          io.emit("raceUpdate", raceStatus);
        }
      }, 1000);

      io.emit("raceUpdate", raceStatus);

      // Mark the current race as active
      const activeRace = raceController.startRace();
      if (activeRace) {
        io.emit("activeRaceId", activeRace.id);
      }

      // Inform clients that the race session has started
      io.emit("racesList", raceController.getRaces());
    }
  });

  // Real-time race mode changes
  socket.on("setRaceMode", (mode) => {
    raceStatus.mode = mode;
    if (mode === "Finished") {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    io.emit("raceUpdate", raceStatus);
  });

  // Handle race end
  socket.on("endRace", () => {
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
    const activeRace = raceController.getActiveRace();
    if (activeRace) {
      const raceId = activeRace.id;
      raceController.deleteRace(
        { params: { id: raceId } },
        {
          status: (code) => ({
            json: (data) => console.log(data)
          })
        }
      );
    }

    io.emit("raceUpdate", raceStatus);
    io.emit("racesList", raceController.getRaces());
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

  socket.on('getRaces', () => {
    const races = raceController.getRaces();
    socket.emit('racesList', races);
  });
});

//---------------------------------------------------
// 9) Start the server
//---------------------------------------------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
