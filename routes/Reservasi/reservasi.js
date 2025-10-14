const {
  addReservasi,
  getReservasi,
} = require("../../controllers/Reservasi/reservasi.controller");

var router = require("express").Router();

router.post("/add", addReservasi);
router.get("/get", getReservasi);

module.exports = router;
