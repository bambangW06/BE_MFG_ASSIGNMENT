const {
  getMachines,
  getMachinesForTMS,
} = require("../../controllers/machiningControllers/machine.controller");

var router = require("express").Router();

router.get("/get", getMachines);
router.get("/TMS", getMachinesForTMS);

module.exports = router;
