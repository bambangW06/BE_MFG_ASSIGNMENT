const {
  getSTDCounter,
} = require("../../controllers/STDCounter/stdCounter.controller");

var router = require("express").Router();

router.get("/get/:id", getSTDCounter);

module.exports = router;
