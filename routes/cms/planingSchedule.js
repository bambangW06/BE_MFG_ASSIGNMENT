const {
  getPlanSchedule,
} = require("../../controllers/machiningControllers/generateSchedule.controller.js");

var router = require("express").Router();

router.get("/get", getPlanSchedule);
module.exports = router;
