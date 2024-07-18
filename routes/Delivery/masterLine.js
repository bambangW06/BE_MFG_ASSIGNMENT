const {
  addMasterLine,
  getMasterLine,
  editMasterLine,
  deleteMasterLine,
} = require("../../controllers/Delivery/masterLine.controller");

var router = require("express").Router();

router.get("/getLine", getMasterLine);
router.post("/addLine", addMasterLine);
router.put("/editLine/:id", editMasterLine);
router.delete("/delete/:id", deleteMasterLine);
module.exports = router;
