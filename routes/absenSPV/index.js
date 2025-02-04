const {
  getAbsenSPV,
  getHistoryAbsensi,
} = require("../../controllers/absenSPV/absenSPV.controller");

var router = require("express").Router();

router.get("/get", getAbsenSPV);
router.get("/history", getHistoryAbsensi);

module.exports = router;
