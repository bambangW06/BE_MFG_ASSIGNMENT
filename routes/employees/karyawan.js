
const {addKaryawan, 
    getKaryawan, 
    editKaryawan, 
    deleteKaryawan, 
    searchKaryawan } = require("../../controllers/karyawan.controller");



var router = require("express").Router();

router.post("/add", addKaryawan);
router.get("/get", getKaryawan );
router.put("/edit/:id", editKaryawan);
router.delete("/delete/:id", deleteKaryawan);
router.get("/search", searchKaryawan);


module.exports = router;
