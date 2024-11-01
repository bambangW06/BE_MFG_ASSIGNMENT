// routes/analisa/analisa.js
const {
  addAnalisa,
  getAnalisa,
} = require("../../controllers/analisa/analisa.controller");
const router = require("express").Router();

router.post("/add", addAnalisa);
router.get("/get", getAnalisa);

module.exports = router;
