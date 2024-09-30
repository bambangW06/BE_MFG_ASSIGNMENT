const {
  addProblem,
  addNextProcess,
  getProblem,
  deleteProblem,
  problemTable,
} = require("../../controllers/problem/problem.controller");

var router = require("express").Router();

router.post("/add", addProblem);
router.post("/nextprocess", addNextProcess);
router.get("/get", getProblem);
router.delete("/delete", deleteProblem);
router.get("/table", problemTable);

module.exports = router;
