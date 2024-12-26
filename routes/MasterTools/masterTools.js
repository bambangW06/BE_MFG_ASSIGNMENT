const {
  addMasterTool,
  getMasterTools,
  editMasterTool,
  deleteMasterTool,
} = require("../../controllers/MasterTools/masterTools.controller");

var router = require("express").Router();

router.post("/add", addMasterTool);
router.get("/get", getMasterTools);
router.put("/edit/:tool_id", editMasterTool);
router.delete("/delete/:tool_id", deleteMasterTool);

module.exports = router;
