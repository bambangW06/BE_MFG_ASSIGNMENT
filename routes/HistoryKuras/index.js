const {
  getHistoryKuras,
} = require("../../controllers/HistoryKuras/historyKuras.controller");

var router = require("express").Router();

router.get("/histories/get/:machine_id", getHistoryKuras);

module.exports = router;
