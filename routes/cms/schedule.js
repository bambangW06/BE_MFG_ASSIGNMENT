const {
  addScheduleKuras,
  getScheduleKuras,
  deleteScheduleKuras,
  editScheduleKuras,
} = require("../../controllers/machiningControllers/schedule.controller");

var router = require("express").Router();

router.post("/add", addScheduleKuras);
router.get("/get", getScheduleKuras);
router.put("/edit/:id", editScheduleKuras);
router.delete("/delete/:id", deleteScheduleKuras);

module.exports = router;
