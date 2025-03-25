const {
  addMasterOli,
  getMasterOli,
  editMasterOli,
  deleteMasterOli,
} = require("../../controllers/MasterOli/masterOli.controller");

var router = require("express").Router();

router.post("/add", addMasterOli);
router.get("/get", getMasterOli);
router.put("/edit/:oil_id", editMasterOli);
router.delete("/delete/:oil_id", deleteMasterOli);

module.exports = router;
