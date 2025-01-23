const {
  getParetoProblem,
} = require("../../controllers/Pareto/garfikPareto.controller");

var router = require("express").Router();

router.get("/get", getParetoProblem);

module.exports = router;
