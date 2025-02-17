const drivers = []; // Store drivers temporarily

// Create a new driver
exports.createDriver = (req, res) => {
	const {name} = req.body;
	if (!name) {
		return res.status(400).json({message: "Driver's name is required."});
	}

	// Check if driver already exists
	const existingDriver = drivers.find(driver => driver.name === name);
	if (existingDriver) {
		return res.status(400).json({message: `Driver ${name} already exists.`});
	}

	const newDriver = {
		id: drivers.length + 1,
		name,
	};
	drivers.push(newDriver);
	res.status(201).json(newDriver);
};

// Get all drivers
exports.getAllDrivers = (req, res) => {
	res.status(200).json(drivers);
};

// Delete a driver
exports.deleteDriver = (req, res) => {
	const driverId = parseInt(req.params.id, 10);
	if (isNaN(driverId)) {
	  return res.status(400).json({message: "Invalid driver ID."});
	}
  
	const index = drivers.findIndex(d => d.id === driverId);
	if (index === -1) {
	  return res.status(404).json({message: `Driver with ID ${driverId} not found.`});
	}
  
	drivers.splice(index, 1); // Remove the driver from the array
	res.status(204).send();
  };

// Export drivers array for use in other controller
exports.drivers = drivers;