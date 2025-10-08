const {
  addMasterNote,
  getMasterNote,
  editMasterNote,
  deleteMasterNote,
} = require("../../controllers/notes/MasterNote.controller");

var router = require("express").Router();

router.post("/add", addMasterNote);
router.get("/get", getMasterNote);
router.put("/edit/:id", editMasterNote);
router.delete("/delete/:id", deleteMasterNote);

module.exports = router;
