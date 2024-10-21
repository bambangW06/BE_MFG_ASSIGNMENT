const {
  getSTDCounter,
  getTimeRanges,
} = require("../../controllers/STDCounter/stdCounter.controller");

var router = require("express").Router();

router.get("/get/:id", getSTDCounter);
router.get("/timeranges/:shift", getTimeRanges);

module.exports = router;
