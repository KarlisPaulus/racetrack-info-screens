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

// Race status default values
const initialTime = process.env.TIMER_DURATION;
let timerInterval = null;
let raceStatus = {running: false, mode: "Danger", remainingTime: 0, timerDuration: initialTime};
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
  res.sendFile(path.join(__dirname, '/../public/lap-line-tracker/lap-line-tracker.html'));
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
// 8) Race/timer logic & Socket.IO events (from MAIN FILE)
//---------------------------------------------------

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Send a test message
  socket.emit('message', 'Welcome to Beachside Racetrack!');

  // Send initial race status
  socket.emit("raceUpdate", raceStatus);

  socket.emit("activeRace", startedRace);

  // Handle race start event
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
          clearInterval(timerInterval); // Stop timer
          raceStatus = {running: true, mode: "Finished", timerDuration: initialTime, timerInterval: null};
          io.emit("raceUpdate", raceStatus);  // Send real-time race update
        }
      }, 1000);

      io.emit("raceUpdate", raceStatus);

    	 // Mark the current race as active
    	  startedRace = raceController.startRace();

    	// Broadcast the active race
        if (startedRace) {
            io.emit("activeRace", startedRace); // Send the active race to all clients
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

    startedRace = null;

    // Emit the updated race status
    io.emit("raceUpdate", raceStatus);
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
    socket.on('getRaces', () => {
        const races = require('./controllers/raceController').getRaces();
        socket.emit('racesList', races);
    });

	socket.on('saveLapTime', (lapData) => {
		console.log('Received lap:', {
			car: lapData.carNumber,
			count: lapData.lapCount,
			type: typeof lapData.lapCount
		});
		
		// Convert carNumber to number
		const carNumber = typeof lapData.carNumber === 'string' ? 
			parseInt(lapData.carNumber.replace('Car ', '')) : 
			lapData.carNumber;
	
		const race = raceController.getActiveRace();
		if (race) {
			const driver = race.drivers.find(d => {
				const driverCarNum = parseInt(d.carAssigned.replace('Car ', ''));
				return driverCarNum === carNumber;
			});
			
			if (driver) {
				if (!driver.lapTimes) driver.lapTimes = [];
				driver.lapTimes.push({
					lapTime: lapData.lapTime,
					formattedLap: lapData.formattedLap,
					bestLap: lapData.bestLap,
					formattedBest: lapData.formattedBest,
					lapCount: Number(lapData.lapCount) // Ensure stored as number
				});
				
				// Emit updates
				io.emit('lapTimeUpdate', {
					carNumber: carNumber,
					lapTime: lapData.lapTime,
					lapCount: Number(lapData.lapCount), // Ensure number
					bestLap: lapData.bestLap,
					formattedLap: lapData.formattedLap,
					formattedBest: lapData.formattedBest
				});
			}
		}
	});
});

//---------------------------------------------------
// 9) Start the server
//---------------------------------------------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
