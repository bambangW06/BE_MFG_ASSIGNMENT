const {
  getHistoryProblem,
} = require("../../controllers/history/historyProblem.controller");

var router = require("express").Router();

router.get("/get", getHistoryProblem);

module.exports = router;
