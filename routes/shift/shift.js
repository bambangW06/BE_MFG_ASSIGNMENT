const { addShift, getShift } = require("../../controllers/shift.controller");

var router = require("express").Router();

router.post("/add", addShift);
router.get("/get", getShift)

module.exports = router