const {
  addProblem,
  addNextProcess,
  getProblem,
} = require("../../controllers/problem/problem.controller");

var router = require("express").Router();

router.post("/add", addProblem);
router.post("/nextprocess", addNextProcess);
router.get("/get", getProblem);

module.exports = router;
