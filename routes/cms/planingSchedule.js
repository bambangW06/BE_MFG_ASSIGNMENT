const {
  getPlanSchedule,
} = require("../../controllers/machiningControllers/plan.controller");

var router = require("express").Router();

router.get("/get", getPlanSchedule);
module.exports = router;
