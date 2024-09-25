const {
  getTools,
  addReportReg,
  getReportReg,
} = require("../../controllers/LaporanHarian/tool.controller");

var router = require("express").Router();

router.get("/get/:line_nm", getTools);
router.post("/add", addReportReg);
router.get("/get/:selectedDate?", getReportReg);

module.exports = router;
