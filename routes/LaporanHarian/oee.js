const {
  addOEE,
  getOEE,
  getAbsensi,
} = require("../../controllers/LaporanHarian/oee.controller");

var router = require("express").Router();

router.post("/add", addOEE);
router.get("/get", getOEE);
router.get("/absensi", getAbsensi);

module.exports = router;
