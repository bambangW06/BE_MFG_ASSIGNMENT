const {
  getKanban,
  preparedTools,
} = require("../../controllers/Delivery/fromGel.controller");

var router = require("express").Router();

router.get("/get", getKanban);
router.put("/prepared/:id", preparedTools);

module.exports = router;
