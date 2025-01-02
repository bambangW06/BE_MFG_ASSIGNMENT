const {
  addMasterProblem,
  getMasterProblems,
  editMasterProblem,
  deleteMasterProblem,
} = require("../../controllers/MasterProblems/masterProblems.contoller");

var router = require("express").Router();

router.post("/add", addMasterProblem);
router.get("/get", getMasterProblems);
router.put("/edit/:problem_id", editMasterProblem);
router.delete("/delete/:problem_id", deleteMasterProblem);

module.exports = router;
