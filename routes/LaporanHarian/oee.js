const {
  addOEE,
  getOEE,
  getAbsensi,
} = require("../../controllers/LaporanHarian/oee.controller");

var router = require("express").Router();

router.post("/add", addOEE);
router.get("/get/:shift", getOEE);
router.get("/absensi/:shift", getAbsensi);

module.exports = router;
