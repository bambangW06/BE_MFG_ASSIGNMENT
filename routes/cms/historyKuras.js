const {
  getHistoryKuras,
} = require("../../controllers/machiningControllers/historyKuras.controller");

var router = require("express").Router();

router.get("/get/:id", getHistoryKuras);

module.exports = router;
