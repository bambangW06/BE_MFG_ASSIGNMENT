const { getGrafik } = require("../../controllers/machiningControllers/grafik.controller");

var router = require("express").Router();

router.get('/get', getGrafik)

module.exports = router