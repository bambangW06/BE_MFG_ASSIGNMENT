const {
  addMasterLine,
  editMasterLine,
  deleteMasterLine,
  getLines,
} = require("../../controllers/MasterLines/masterLines.controller");

var router = require("express").Router();

router.get("/get", getLines);
router.post("/add", addMasterLine);
router.put("/edit/:line_id", editMasterLine);
router.delete("/delete/:line_id", deleteMasterLine);
module.exports = router;
