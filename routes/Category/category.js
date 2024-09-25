const {
  getCategory,
} = require("../../controllers/category/category.controller");

var router = require("express").Router();

router.get("/get", getCategory);

module.exports = router;
