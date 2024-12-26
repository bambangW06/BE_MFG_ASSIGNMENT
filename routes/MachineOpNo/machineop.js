const {
  getMachine,
  getLines,
} = require("../../controllers/MachineOpNo/machine.controller");

var router = require("express").Router();

router.get("/lines/get", getLines);
router.get("/get/:line_nm", getMachine);
module.exports = router;
