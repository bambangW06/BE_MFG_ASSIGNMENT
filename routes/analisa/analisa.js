// routes/analisa/analisa.js
const {
  addAnalisa,
  getAnalisa,
  editAnalisaProblem,
  deleteAnalisaProblem,
} = require("../../controllers/analisa/analisa.controller");
const router = require("express").Router();

router.post("/add", addAnalisa);
router.get("/get", getAnalisa);
router.put("/edit/:id", editAnalisaProblem);
router.delete("/delete/:id", deleteAnalisaProblem);

module.exports = router;
