const {
  addMasterTool,
  getMasterTool,
  editMasterTool,
  deleteMasterTool,
} = require("../../controllers/Delivery/masterTool.controller");

var router = require("express").Router();

router.post("/add", addMasterTool);
router.get("/get", getMasterTool);
router.put("/edit/:id", editMasterTool);
router.delete("/delete/:id", deleteMasterTool);
module.exports = router;
