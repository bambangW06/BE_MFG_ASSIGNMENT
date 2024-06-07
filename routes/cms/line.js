const { getLine } = require("../../controllers/machiningControllers/line.controller");

var router = require("express").Router();

router.get("/get", getLine);


module.exports = router