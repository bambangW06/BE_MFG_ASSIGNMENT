const {
  getNonShift,
  postAbsen,
} = require("../../controllers/NonShift/nonshift.controller");

var router = require("express").Router();

router.get("/get", getNonShift);

module.exports = router;
