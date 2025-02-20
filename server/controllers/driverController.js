const drivers = []; // Store drivers temporarily
const cars = [
    { id: 1, name: 'Car 1' },
    { id: 2, name: 'Car 2' },
    { id: 3, name: 'Car 3' },
    { id: 4, name: 'Car 4' },
    { id: 5, name: 'Car 5' },
    { id: 6, name: 'Car 6' },
    { id: 7, name: 'Car 7' },
    { id: 8, name: 'Car 8' }
]; // Fixed set of cars

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
		carAssigned: null // No car assigned initially
	};
	drivers.push(newDriver);
	res.status(201).json(newDriver);
};

// Get all drivers
exports.getAllDrivers = (req, res) => {
	res.status(200).json(drivers);
};

// Get a driver by their name
exports.getDriverByName = (req, res) => {
	const driver = drivers.find(d =>  d.name === req.params.name);
	if (!driver) {
		return res.status(404).json({message: `Driver ${req.params.name} not found.`});
	}
	res.status(200).json(driver);
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

// Assign a car to a driver
exports.assignCarToDriver = (req, res) => {
	const {carId} = req.body; // Car number (1-8)
	const driverName = req.params.name;

	// Find driver by name
	const driver = drivers.find(d => d.name === req.params.name);
	if (!driver) {
        return res.status(404).json({ message: `Driver ${driverName} not found.` });
    }

	// Find car by ID (1-8)
	const car = cars.find(c => c.id === carId);
    if (!car) {
        return res.status(404).json({ message: `Car number ${carId} not found.` });
    }

	// Assing the car to the driver
	driver.carAssigned = car.name;
	res.status(200).json({message: `${car.name} assigned to driver ${req.params.name}.`, driver});
};

// Export drivers array for use in other controller
exports.drivers = drivers;