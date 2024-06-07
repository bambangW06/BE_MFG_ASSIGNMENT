const { getHistory } = require("../../controllers/history.controller");

var router = require("express").Router();

router.get("/get", getHistory );


module.exports = router