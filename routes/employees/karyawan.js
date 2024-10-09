const {
  addKaryawan,
  getKaryawan,
  editKaryawan,
  deleteKaryawan,
} = require("../../controllers/karyawan.controller");

var router = require("express").Router();

router.post("/add", addKaryawan);
router.get("/get", getKaryawan);
router.put("/edit/:id", editKaryawan);
router.delete("/delete/:id", deleteKaryawan);

module.exports = router;
