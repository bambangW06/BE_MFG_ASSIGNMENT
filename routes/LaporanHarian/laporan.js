const {
  getTools,
  addReportReg,
  getReportReg,
} = require("../../controllers/LaporanHarian/tool.controller");

var router = require("express").Router();

router.get("/get/:line_nm", getTools);
router.post("/add", addReportReg);
router.get("/get", getReportReg);

module.exports = router;
