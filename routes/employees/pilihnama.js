const { getEmployees } = require("../../controllers/pilihdata.controller");

var router = require("express").Router();

router.get("/get", getEmployees); 

module.exports = router