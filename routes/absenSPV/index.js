const {
  getAbsenSPV,
} = require("../../controllers/absenSPV/absenSPV.controller");

var router = require("express").Router();

router.get("/get", getAbsenSPV);

module.exports = router;
