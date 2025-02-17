const races = [];
const {drivers} = require('./driverController');

exports.createRace = (req, res) => {
	const { name, drivers: driverNames } = req.body;
  
	if (!name) {
	  return res.status(400).json({message: "Race name is required."});
	}
  
	// Check if session already exists
	const existingRace = races.find(race => race.name === name);
	if (existingRace) {
	  return res.status(400).json({message: `Race session ${name} already exists.`});
	}
  
	// Ensure no more than 8 drivers in the race
	if (driverNames && driverNames.length > 8) {
	  return res.status(400).json({message: "A race session can have a maximum of 8 drivers."});
	}
  
	// Validate drivers
	const raceDrivers = [];
	if (driverNames) {
	  for (const driverName of driverNames) {
		const driver = drivers.find(d => d.name === driverName); // Find the driver object by name
		if (!driver) {
		  return res.status(404).json({message: `Driver ${driverName} not found.`});
		}
		if (raceDrivers.find(d => d.name === driver.name)) { // Ensure no duplicate drivers
		  return res.status(400).json({message: `Driver ${driverName} is already added to this race.`});
		}
		raceDrivers.push(driver); // Add the entire driver object to the race
	  }
	}
  
	// Create new race object
	const newRace = {
	  id: races.length + 1,
	  name,
	  drivers: raceDrivers // Store full driver objects in the race
	};
  
	races.push(newRace);
	res.status(201).json(newRace);
  };  

exports.getAllRaces = (req, res) => {
	res.status(200).json(races);
};

exports.deleteRace = (req, res) => {
	const index = races.findIndex(r => r.id === parseInt(req.params.id));
	if (index === -1) {
		return res.status(404).json({message: "Race session not found."});
	}
	races.splice(index, 1);
	res.status(204).send();
};

