const {
  getParameterOptions,
  getRangeOptions,
  addParamterChecks,
  getParameterCheckResult,
} = require("../../controllers/Parameter/parameter.controller");

var router = require("express").Router();

router.get("/get", getParameterOptions);
router.get("/range", getRangeOptions);
router.post("/add", addParamterChecks);
router.get("/getResult", getParameterCheckResult);
module.exports = router;
