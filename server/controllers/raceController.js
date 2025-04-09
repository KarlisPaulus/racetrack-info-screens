const { Race, Driver, LapTime, RaceStatus } = require('../../db/database');
let io = null; // Initialize io as null

// Function to set the io instance
exports.setIO = (socketIO) => {
  io = socketIO;
};

// Request to create a race
exports.createRace = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({message: "Race name is required."});
  }

  try {
    // Check if session already exists
    const existingRace = await Race.findOne({ where: { name } });
    if (existingRace) {
      return res.status(400).json({message: `Race session ${name} already exists.`});
    }

     // Create race
     const newRace = await Race.create({ name });
     const race = await Race.findAll({where: {active: false}, include: [{ model: Driver, as: 'drivers' }]});

    // Emit the new race to all clients
    if (io) {
      io.emit('raceCreated', newRace);
      io.emit('racesList', race); // Emit only inactive races
    } else {
      console.error("Socket.IO instance (io) is not initialized.");
    }

    res.status(201).json(race);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: "Internal server error."})
  }
};

// Request to get all races
exports.getAllRaces = async (req, res) => {
	try {
    const races = await Race.findAll({where: {active: false}, include: { model: Driver, as: 'drivers' }});
    res.status(200).json(races);
  } catch (error) {
    console.error("Error in getAllRaces:", error);
    res.status(500).json({message: "Internal server error."});
  }
};

// Mark the current race as active
exports.startRace = async () => {
  try {
    // Find the first inactive race
    const race = await Race.findOne({ where: { active: false }, include: { model: Driver, as: 'drivers' }});
    if (!race) {
      console.error("No inactive races found.");
      return null; // Return null if no inactive races exist
    }

    // Mark the race as active
    race.active = true;
    await race.save();

    // Emit the updated races list to all clients
    if (io) {
      const updatedRaces = await Race.findAll({ where: { active: false }, include: { model: Driver, as: 'drivers' }});
      io.emit('racesList', updatedRaces); // Emit only inactive races
    }

    return race; // Return the active race
  } catch (error) {
    console.error("Error in startRace:", error);
    return null; // Return null in case of an error
  }
};

// Function to get the list of races for Next-Race page
exports.getRaces = async () => {
  const races = await Race.findAll({
    where: { active: false },
    include: { model: Driver, as: 'drivers' },
  });
  return races; // Only return inactive races
};

// Request to get a race by Id
exports.getRaceById = async (req, res) => {
	const {id} = req.params;

  try {
    const race = await Race.findByPk(id, {include: { model: Driver, as: 'drivers' }});
    if (!race) {
      return res.status(404).json({ message: "Race session not found." });
    }

    res.status(200).json(race);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Request to update a race
exports.updateRace = async (req, res) => {
  const { id } = req.params;
	const {name, drivers} = req.body;
  
  try {
    const race = await Race.findByPk(id, { include: { model: Driver, as: 'drivers' }});
    if (!race) {
      return res.status(404).json({ message: "Race session not found." });
    }

    // Update race name if provided
    if (name) {
      race.name = name;
    }
    
    if (drivers) {
      if (drivers.length > 8) {
        return res.status(400).json({ message: "A race session can have a maximum of 8 drivers." });
      }

      // Validate Drivers
      const driverNames = drivers.map(driver => driver.name);
      if (new Set(driverNames).size !== driverNames.length) {
        return res.status(400).json({ message: "Driver names must be unique within the race." });
      }

      race.drivers = drivers;
    }

    await race.save();

    // Emit the updated race to all clients
    if (io) {
      io.emit('raceUpdated', race);
    }

    res.status(200).json(race);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
}; 

// Request to delete a race
exports.deleteRace = async (raceId) => {

  try {
  const race = await Race.findByPk(raceId);
  if (!race) {
    return { success: false, message: "Race not found." };
  }

  await race.destroy(); // Remove the race from the array

  // Emit the updated list of races to all clients
  if (io) {
    const races = await Race.findAll({ where: { active: false }, include: { model: Driver, as: 'drivers' }});
    io.emit('racesList', races); // Only emit inactive races
  }

	// Send a success response back to the client if race is deleted
  return { success: true, message: "Race deleted successfully." };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Internal server error." };
  }
};

// Request to create a driver and assign a car
exports.createDriverAndCar = async (req, res) => {
  const { id } = req.params;  // Selected race id
  const { driverName, carId } = req.body;

    try {
        const race = await Race.findByPk(id, { include: { model: Driver, as: 'drivers' }});
        if (!race) {
            return res.status(404).json({ message: "Race session not found." });
        }

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
        await Driver.create({
          name: driverName,
          carAssigned: `Car ${carId}`,
          RaceId: race.id,
        });

        // Fetch the updated race with drivers
        const updatedRace = await Race.findByPk(id, { include: { model: Driver, as: 'drivers' }});

        // Emit the updated race to all clients
        if (io) {
          io.emit('raceUpdated', updatedRace);
        }

        res.status(201).json({ message: `Driver ${driverName} created and assigned Car ${carId} in race ${race.name}.`, race });
    } catch (error) {
        console.error("Error in createDriverAndCar:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Request to save lap time
exports.saveLapTime = async (req, res) => {
  const { id } = req.params;  // Current race
  const { carNumber, lapTime, formattedLap, bestLap, formattedBest, lapCount } = req.body;
  
  try {
    const race = await Race.findByPk(id, { include: { model: Driver, as: 'drivers' }});
    if (!race) {
      return res.status(404).json({ message: "Race session not found." });
    }
    
    // Find the driver by car number
    const driver = race.drivers.find(d => d.carAssigned === `Car ${carNumber}`);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found." });
    }
    
    // Save lap time data
    const newLapTime = await LapTime.create({
      lapTime,
      formattedLap,
      bestLap,
      formattedBest,
      lapCount,
      DriverId: driver.id,
    });
    
    // Emit the updated lap time to all clients
    if (io) {
      io.emit('lapTimeUpdate', {
        raceId: id,
        carNumber,
        lapTime: newLapTime.lapTime,
        formattedLap: newLapTime.formattedLap,
        bestLap: newLapTime.bestLap,
        formattedBest: newLapTime.formattedBest,
        lapCount: newLapTime.lapCount,
      });
    }
    
    res.status(200).json({ message: "Lap time saved successfully.", lapTime: newLapTime});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};
  
// Function to get the active race
exports.getActiveRace = async () => {
  const race = await Race.findOne({
    where: { active: true },
    include: { model: Driver, as: 'drivers', include: [{ model: LapTime }]}
  });
  return race;
};