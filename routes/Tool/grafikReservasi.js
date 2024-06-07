const {
  getGrafikReservasi,
} = require("../../controllers/ToolReg/grafikReservasi.controller");

var router = require("express").Router();

router.get("/get", getGrafikReservasi);

module.exports = router;
