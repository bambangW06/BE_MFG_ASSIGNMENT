const {
  getHistoryKuras,
} = require("../../controllers/machiningControllers/historyKuras.controller");

var router = require("express").Router();

router.get("/get", getHistoryKuras);

module.exports = router;
