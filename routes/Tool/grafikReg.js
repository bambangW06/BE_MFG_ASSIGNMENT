const {
  getGrafikRegrinding,
} = require("../../controllers/ToolReg/grafikReg.controller");

var router = require("express").Router();

router.get("/get", getGrafikRegrinding);

module.exports = router;
