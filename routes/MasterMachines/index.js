const {
  getMasterMachines,
  addMasterMachine,
  editMasterMachine,
  deleteMasterMachine,
  getCellNm,
  getLastIndex,
} = require("../../controllers/MasterMachines/masterMachines.controller");

var router = require("express").Router();

router.get("/get", getMasterMachines);
router.post("/add", addMasterMachine);
router.put("/edit/:machine_id", editMasterMachine);
router.delete("/delete/:machine_id", deleteMasterMachine);
router.get("/cell/:root_line_id", getCellNm);
router.get("/lastIndexPos", getLastIndex);

module.exports = router;
