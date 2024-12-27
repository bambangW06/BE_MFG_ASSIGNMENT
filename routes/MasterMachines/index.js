const {
  getMasterMachines,
  addMasterMachine,
  editMasterMachine,
  deleteMasterMachine,
} = require("../../controllers/MasterMachines/masterMachines.controller");

var router = require("express").Router();

router.get("/get", getMasterMachines);
router.post("/add", addMasterMachine);
router.put("/edit/:machine_id", editMasterMachine);
router.delete("/delete/:machine_id", deleteMasterMachine);

module.exports = router;
