var express = require("express");
var router = express.Router();
var Karyawan = require("./employees/karyawan");
var pilih = require("./employees/pilihnama");
var absences = require("./absences/absence");
var history = require("./history/absen");
var lines = require("./cms/line");
var machines = require("./cms/machine");
var grafik = require("./cms/grafik");
var shift = require("./shift/shift");
var position = require("./mapingpos/maping");
var parameters = require("./cms/parameters");
var schedules = require("./cms/schedule");
var planSchedule = require("./cms/planingSchedule");
var reservasi = require("./Tool/reservasi");
var grafikReservasi = require("./Tool/grafikReservasi");
var regrinding = require("./Tool/regrinding");
var grafikRegrinding = require("./Tool/grafikReg");
var planMonth = require("./cms/planMotnh");
var historySchedule = require("./cms/history");
var historyKuras = require("./cms/historyKuras");
var delivery = require("./Delivery/masterLine");
var masterTools = require("./Delivery/masterTool");
var kanban = require("./Delivery/kanban");

router.use("/employees", Karyawan);
router.use("/select", pilih);
router.use("/presence", absences);
router.use("/histories", history);
router.use("/lines", lines);
router.use("/machines", machines);
router.use("/grafik", grafik);
router.use("/shift", shift);
router.use("/position", position);
router.use("/parameters", parameters);
router.use("/schedules", schedules);
router.use("/planSchedule", planSchedule);
router.use("/reservasi", reservasi);
router.use("/grafikreservasi", grafikReservasi);
router.use("/regrinding", regrinding);
router.use("/grafikRegrinding", grafikRegrinding);
router.use("/planMonth", planMonth);
router.use("/historySchedule", historySchedule);
router.use("/historyKuras", historyKuras);
router.use("/delivery", delivery);
router.use("/masterTools", masterTools);
router.use("/kanban", kanban);
module.exports = router;
