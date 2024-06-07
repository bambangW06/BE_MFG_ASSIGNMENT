const { addAbsence, getAbsen } = require("../../controllers/absen.controller");

var router = require("express").Router();

router.post("/add", addAbsence)
router.get("/get", getAbsen)
module.exports = router