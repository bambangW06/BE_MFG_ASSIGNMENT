const {
  getTimerange,
  addTimerange,
  editTimerange,
  deleteTimerange,
} = require("../../controllers/TimeRange/TimeRange.controller");

var router = require("express").Router();

router.get("/timerange", getTimerange);
router.post("/add", addTimerange);
router.put("/edit", editTimerange);
router.delete("/delete/:time_id", deleteTimerange);

module.exports = router;
