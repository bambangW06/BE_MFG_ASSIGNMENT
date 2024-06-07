const {
  addPosisi,
  getStatusPos,
  getPosition,
} = require("../../controllers/history/posisi.controller");

var router = require("express").Router();

router.post("/add", addPosisi);
router.get("/get", getStatusPos);
router.get("/position", getPosition);
module.exports = router;
