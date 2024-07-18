var database = require("../../config/storage");
var moment = require("moment-timezone");

module.exports = {
  addScheduleKuras: async (req, res) => {
    try {
      const {
        line_id,
        line_nm,
        machines,
        last_krs,
        shift,
        periodVal,
        periodNm,
      } = req.body;

      if (
        !line_id ||
        !line_nm ||
        !machines ||
        !last_krs ||
        !shift ||
        !periodVal ||
        !periodNm
      ) {
        return res.status(400).json({ message: "Bidang wajib tidak lengkap" });
      }

      const q = `INSERT INTO tb_m_master_schedules (line_id, line_nm, machine_id, machine_nm, last_krs, shift, period_val, period_nm)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`;

      const scheduleData = [];

      for (const machine of machines) {
        const values = [
          line_id,
          line_nm,
          machine.machine_id,
          machine.machine_nm,
          last_krs,
          shift,
          periodVal,
          periodNm,
        ];
        const client = await database.connect();
        const userDataQuery = await client.query(q, values);
        scheduleData.push(userDataQuery.rows[0]);
        client.release();
      }
      res.status(201).json({
        message: "Success to Add Schedule",
        data: scheduleData,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to Add Schedule",
        error: error,
      });
    }
  },

  getScheduleKuras: async (req, res) => {
    try {
      let whereCond = ``;
      const machine_nm = req.query.machine_nm;
      // console.log("machine_nm", machine_nm);
      const moment = require("moment-timezone");
      if (machine_nm) {
        // Menggunakan LIKE untuk mencocokkan sebagian dari nilai pada beberapa kolom
        whereCond = `WHERE tb_m_master_schedules.machine_nm LIKE '%${machine_nm}%'`;
      }
      const q = `SELECT * FROM tb_m_master_schedules ${whereCond}`;
      const client = await database.connect();
      const scheduleDataQuery = await client.query(q);
      const scheduleData = scheduleDataQuery.rows;
      client.release();
      // Memastikan data tanggal ditangani dengan benar
      if (scheduleData.length > 0) {
        // Konversi tanggal ke zona waktu 'Asia/Jakarta' menggunakan moment-timezone
        scheduleData.forEach((row) => {
          row.last_krs = moment(row.last_krs)
            .tz("Asia/Jakarta")
            .format("DD-MM-YYYY");
        });
      }

      // console.log("data dikrim ke FE", scheduleData);
      res.status(200).json({
        message: "Success to Get Schedule",
        data: scheduleData,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to Get Schedule",
        error: error,
      });
    }
  },
  editScheduleKuras: async (req, res) => {
    try {
      const id = req.params.id;
      const {
        line_id,
        line_nm,
        machine_id,
        machines,
        last_krs,
        shift,
        periodVal,
        periodNm,
      } = req.body;

      // Logging untuk input dari frontend
      console.log("Raw Last KRS from Frontend:", last_krs);

      // Validasi input wajib
      if (
        !id ||
        !line_id ||
        !line_nm ||
        !machines ||
        !last_krs ||
        !shift ||
        !periodVal ||
        !periodNm
      ) {
        return res.status(400).json({ message: "Bidang wajib tidak lengkap" });
      }

      // Verifikasi apakah last_krs adalah tanggal yang valid dalam format YYYY-MM-DD
      if (!moment(last_krs, "YYYY-MM-DD", true).isValid()) {
        console.log("Invalid date format:", last_krs);
        return res
          .status(400)
          .json({ message: "Format tanggal last_krs tidak valid" });
      }

      // Koneksi ke database
      const client = await database.connect();

      // Query untuk mendapatkan data yang ada sebelum diedit
      const currentDataQuery = await client.query(
        `SELECT last_krs, period_val, period_nm FROM tb_m_master_schedules WHERE schedule_id = $1`,
        [id]
      );
      const currentData = currentDataQuery.rows[0];

      // Debug log untuk data yang diambil dari database
      console.log(`Current Data from DB:`, currentData);

      // Inisialisasi kolom yang akan diupdate
      let columnsToUpdate = [
        "line_id = $1",
        "line_nm = $2",
        "machine_id = $3",
        "machine_nm = $4",
        "last_krs = $5",
        "shift = $6",
        "period_val = $7",
        "period_nm = $8",
      ];
      let values = [
        line_id,
        line_nm,
        machine_id,
        machines,
        last_krs, // menggunakan last_krs langsung
        shift,
        periodVal,
        periodNm,
        id, // ID untuk klausa WHERE
      ];

      // Periksa apakah last_krs, period_val, atau period_nm berubah
      if (
        currentData.last_krs !== last_krs ||
        currentData.period_val !== periodVal ||
        currentData.period_nm.toLowerCase() !== periodNm.toLowerCase()
      ) {
        // Hitung nilai plan_dt baru
        let plan_dt;

        // Parsing last_krs menjadi objek tanggal dengan moment
        const lastKrsDate = moment(last_krs, "YYYY-MM-DD");

        // Debug log untuk tanggal last_krs setelah parsing
        console.log(
          `Parsed Last KRS Date: ${lastKrsDate.format("YYYY-MM-DD")}`
        );

        // Hitung plan_dt berdasarkan periodNm dan periodVal
        switch (periodNm.toLowerCase()) {
          case "day":
          case "days":
            plan_dt = lastKrsDate
              .add(parseInt(periodVal, 10), "days")
              .format("YYYY-MM-DD");
            break;
          case "month":
          case "months":
            plan_dt = lastKrsDate
              .add(parseInt(periodVal, 10), "months")
              .format("YYYY-MM-DD");
            break;
          case "year":
          case "years":
            plan_dt = lastKrsDate
              .add(parseInt(periodVal, 10), "years")
              .format("YYYY-MM-DD");
            break;
          default:
            // Jika periodNm tidak dikenal, kembalikan error
            return res.status(400).json({ message: "PeriodNm tidak dikenal" });
        }

        // Debug log untuk nilai plan_dt yang dihitung
        console.log(`Calculated Plan Date: ${plan_dt}`);

        // Tambahkan update plan_dt ke query
        columnsToUpdate.push("plan_dt = $10");
        values.push(plan_dt);
      }

      // Buat query dengan kolom yang akan diupdate
      const q = `UPDATE tb_m_master_schedules
                 SET ${columnsToUpdate.join(", ")}
                 WHERE schedule_id = $9
                 RETURNING *`;

      // Menjalankan query update
      const userDataQuery = await client.query(q, values);
      const userData = userDataQuery.rows;
      client.release();

      // Mengirimkan respons ke frontend
      res.status(200).json({
        message: "Success to Edit Data",
        data: userData,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to Edit Data",
        error: error,
      });
    }
  },

  deleteScheduleKuras: async (req, res) => {
    try {
      const id = req.params.id;
      const q = `DELETE FROM tb_m_master_schedules WHERE schedule_id = $1`;
      const client = await database.connect();
      const userDataQuery = await client.query(q, [id]);
      const userData = userDataQuery.rows;
      client.release();
      res.status(201).json({
        message: "Success to Delete Data",
        data: userData,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to Delete Data",
        error: error,
      });
    }
  },
};
