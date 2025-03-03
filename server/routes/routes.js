const express = require("express");
const router = express.Router();
const raceController = require("../controllers/raceController");

// Race Session Management
router.post("/races", raceController.createRace);
router.get("/races", raceController.getAllRaces);
router.delete("/races/:id", raceController.deleteRace);
router.get("/races/:id", raceController.getRaceById);
router.put("/races/:id", raceController.updateRace);

// Create Driver and Assign Car
router.post("/races/:id/create-driver", raceController.createDriverAndCar);

module.exports = router;