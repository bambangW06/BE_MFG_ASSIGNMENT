
const { getMachines } = require("../../controllers/machiningControllers/machine.controller");


var router = require("express").Router();

router.get('/get', getMachines)

module.exports = router

