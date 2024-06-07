const {
  addRegrinding,
  getRegrinding,
} = require("../../controllers/ToolReg/regrinding.controller");

var router = require("express").Router();

router.post("/add", addRegrinding);
router.get("/get", getRegrinding);
module.exports = router;
