const {
  getHistoryChemical,
} = require("../../controllers/HistoryChemical/HistoryChemical.controller");

var router = require("express").Router();

router.get("/get", getHistoryChemical);

module.exports = router;
