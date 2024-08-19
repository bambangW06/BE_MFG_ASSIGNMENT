const {
  getKanban,
  addRequestTool,
} = require("../../controllers/Delivery/kanban.controller");

var router = require("express").Router();

router.get("/get", getKanban);
router.post("/add", addRequestTool);

module.exports = router;
