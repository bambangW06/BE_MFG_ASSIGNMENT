const {
  addHistorySchedule,
  getHistorySchedule,
} = require("../../controllers/machiningControllers/historySchedule.controller");

var router = require("express").Router();

router.post("/add", addHistorySchedule);
router.get("/get", getHistorySchedule);
module.exports = router;
