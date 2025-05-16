const {
  addMasterOption,
  editMasterOption,
  softDeletetMasterOption,
} = require("../../controllers/MasterOli/masterOption.controller");

var router = require("express").Router();

router.post("/add", addMasterOption);
router.put("/edit/:option_id", editMasterOption);
router.delete("/delete/:option_id", softDeletetMasterOption);

module.exports = router;
