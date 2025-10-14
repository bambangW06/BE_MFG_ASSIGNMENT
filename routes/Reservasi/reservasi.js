const {
  addReservasi,
  getReservasi,
  addReservasiNote,
} = require("../../controllers/Reservasi/reservasi.controller");

var router = require("express").Router();

router.post("/add", addReservasi);
router.get("/get", getReservasi);
router.post("/add-note", addReservasiNote);

module.exports = router;
