const {
  getParameter,
} = require("../../controllers/machiningControllers/parameters.controller");

var router = require("express").Router();

router.get("/get", getParameter);

module.exports = router;
