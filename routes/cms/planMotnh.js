const {
  getPlanMonth,
  getSearchSchedule,
  editSearchScheduleKuras,
} = require("../../controllers/machiningControllers/planMonth.controller");

var router = require("express").Router();

router.get("/get/?:year", getPlanMonth);
router.get("/search", getSearchSchedule);
router.put("/edit/:id", editSearchScheduleKuras);
module.exports = router;
