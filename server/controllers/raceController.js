const races = [];
let io = null; // Initialize io as null

// Function to set the io instance
exports.setIO = (socketIO) => {
  io = socketIO;
};

// Request to create a race
exports.createRace = (req, res) => {
  const { name, drivers = [] } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Race name is required." });
  }

  // Check if session already exists
  const existingRace = races.find(race => race.name === name);
  if (existingRace) {
    return res.status(400).json({ message: `Race session ${name} already exists.` });
  }

  // Validate drivers
  const driverNames = drivers ? drivers.map(driver => driver.name) : [];
  if (new Set(driverNames).size !== driverNames.length) {
    return res.status(400).json({ message: "Driver names must be unique in the race." });
  }

  // Create new race object
  const newRace = {
    id: races.length + 1,
    name,
    drivers,
	active: false // Mark the race as inactive by default
  };

  races.push(newRace);

  // Emit the new race to all clients
  if (io) {
    io.emit('raceCreated', newRace);
	io.emit('racesList', races.filter(r => !r.active)); // Emit only inactive races
  } else {
    console.error("Socket.IO instance (io) is not initialized.");
  }

  res.status(201).json(newRace);
}; 

// Request to get all races
exports.getAllRaces = (req, res) => {
	res.status(200).json(races.filter(r => !r.active));
};

// Mark the current race as active
exports.startRace = () => {
    if (races.length > 0) {
        const race = races[0]; // Get the first race
        race.active = true; // Mark the race as active

        // Remove the active race from the upcoming races list
        const updatedRaces = races.filter(r => !r.active);

        // Emit the updated races list to all clients
        if (io) {
            io.emit('racesList', updatedRaces);
        }

        return race; // Return the active race
    }
    return null; // Return null if no races exist
};

// Function to get the list of races for Next-Race page
exports.getRaces = () => {
    return races.filter(r => !r.active); // Only return inactive races
};

// Request to get a race by Id
exports.getRaceById = (req, res) => {
	const race = races.find(r => r.id === parseInt(req.params.id));
	if (!race) {
		return res.status(404).json({message: "Race session not found."});
	}
	res.status(200).json(race);
};

// Request to update a race
exports.updateRace = (req, res) => {
	const race = races.find(r => r.id === parseInt(req.params.id));
	if (!race) {
	  return res.status(404).json({ message: "Race session not found." });
	}
  
	const {name, drivers = []} = req.body;

	// Update race name if provided
	if (name) race.name = name;
  
	
    if (drivers.length > 8) {
        return res.status(400).json({ message: "A race session can have a maximum of 8 drivers." });
    }

    // Validate Drivers
    const driverNames = drivers.map(driver => driver.name);
    if (new Set(driverNames).size !== driverNames.length) {
        return res.status(400).json({ message: "Driver names must be unique within the race." });
    }

    race.drivers = drivers;

	 // Emit the updated race to all clients
    if (io) {
        io.emit('raceUpdated', race);
    }
	
	res.status(200).json(race);
  }; 

// Request to delete a race
exports.deleteRace = (req, res) => {
	const raceId = parseInt(req.params.id); // Get the race ID from the request parameters
    console.log("Deleting race with ID:", raceId); // Debug log

    const index = races.findIndex(r => r.id === raceId);
    if (index === -1) {
        console.error("Race not found:", raceId);
        return res.status(404).json({ message: "Race not found." });
    }

    races.splice(index, 1); // Remove the race from the array

    // Emit the updated list of races to all clients
    if (io) {
        io.emit('racesList', races.filter(r => !r.active)); // Only emit inactive races
    }
	// Send a success response back to the client
    res.status(200).json({ message: "Race deleted successfully." });
};

// Request to create a driver and assign a car
exports.createDriverAndCar = (req, res) => {
    try {
        const race = races.find(r => r.id === parseInt(req.params.id));
        if (!race) {
            return res.status(404).json({ message: "Race session not found." });
        }

        const { driverName, carId } = req.body;

        // Validate driver name
        if (!driverName || typeof driverName !== "string") {
            return res.status(400).json({ message: "Driver name is required and must be a string." });
        }

        // Check if the driver already exists in the race
        const driverExists = race.drivers.some(d => d.name === driverName);
        if (driverExists) {
            return res.status(400).json({ message: `Driver ${driverName} already exists in this race.` });
        }

        // Check if the race already has 8 drivers
        if (race.drivers.length >= 8) {
            return res.status(400).json({ message: "A race session can have a maximum of 8 drivers." });
        }

        // Validate car ID
        if (isNaN(carId)) {
            return res.status(400).json({ message: "Invalid car ID. Please enter a valid number." });
        }

        // Check if the car ID is already assigned to another driver
        const carExists = race.drivers.some(d => d.carAssigned === `Car ${carId}`);
        if (carExists) {
            return res.status(400).json({ message: `Car ${carId} is already assigned to another driver in this race.` });
        }

        // Create the new driver and assign the car
        const newDriver = {
            name: driverName,
            carAssigned: `Car ${carId}`,
        };

        race.drivers.push(newDriver);

        // Emit the updated race to all clients
        if (io) {
            io.emit('raceUpdated', race);
        }

        res.status(201).json({ message: `Driver ${driverName} created and assigned Car ${carId} in race ${race.name}.`, race });
    } catch (error) {
        console.error("Error in createDriverAndCar:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Request to save lap time
exports.saveLapTime = (req, res) => {
	const raceId = parseInt(req.params.id);
	const { carNumber, lapTime, formattedLap, bestLap, formattedBest } = req.body;
  
	const race = races.find(r => r.id === raceId);
	if (!race) {
	  return res.status(404).json({ message: "Race session not found." });
	}
  
	// Find the driver by car number
	const driver = race.drivers.find(d => d.carAssigned === `Car ${carNumber}`);
	if (!driver) {
	  return res.status(404).json({ message: "Driver not found." });
	}
  
	// Save lap time data
	if (!driver.lapTimes) {
	  driver.lapTimes = [];
	}
	driver.lapTimes.push({ lapTime, formattedLap, bestLap, formattedBest });
  
	// Emit the updated race to all clients
	if (io) {
	  io.emit('raceUpdated', race);
	}
  
	res.status(200).json({ message: "Lap time saved successfully.", race });
  };
  
// Function to get the active race
exports.getActiveRace = () => {
    return races.find(race => race.active); // Return the active race
};