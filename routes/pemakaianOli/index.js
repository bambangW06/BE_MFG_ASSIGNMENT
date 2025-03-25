const {
  addPemakaianOli,
  getMachines,
  getPemakaianOli,
} = require("../../controllers/pemakaianOli/pemakaianOli.controller");

var router = require("express").Router();

router.post("/add", addPemakaianOli);
router.get("/machines", getMachines);
router.get("/oils-usage", getPemakaianOli);

module.exports = router;
