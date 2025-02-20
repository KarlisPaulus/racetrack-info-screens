const express = require("express");
const router = express.Router();
const raceController = require("../controllers/raceController");
const driverController = require("../controllers/driverController");

// Race Session Management
router.post("/races", raceController.createRace);
router.get("/races", raceController.getAllRaces);
router.delete("/races/:id", raceController.deleteRace);
router.get("/races/:id", raceController.getRaceById);
router.put("/races/:id", raceController.updateRace);

// Driver Management
router.post("/drivers", driverController.createDriver);
router.get("/drivers", driverController.getAllDrivers);
router.delete("/drivers/:id", driverController.deleteDriver);
router.get("/drivers/:name", driverController.getDriverByName);
router.put('/drivers/:name/car', driverController.assignCarToDriver);

module.exports = router;