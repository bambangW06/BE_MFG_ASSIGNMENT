const {
  getEmployees,
  getSupervisor,
} = require("../../controllers/pilihdata.controller");

var router = require("express").Router();

router.get("/get", getEmployees);
router.get("/supervisor", getSupervisor);

module.exports = router;
