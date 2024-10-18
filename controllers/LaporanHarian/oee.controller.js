const database = require("../../config/storage");
const moment = require("moment-timezone");

module.exports = {
  addOEE: async (req, res) => {
    try {
      const { shift, actMp, jamKerja, total, oee } = req.body;

      const client = await database.connect();

      // Cek apakah data untuk shift tertentu sudah ada hari ini
      const checkQuery = `
        SELECT * FROM tb_r_oee 
        WHERE shift = $1 AND DATE(created_dt) = CURRENT_DATE
      `;
      const checkResult = await client.query(checkQuery, [shift]);

      let userData;

      if (checkResult.rows.length > 0) {
        // Jika data sudah ada, lakukan update
        const updateQuery = `
          UPDATE tb_r_oee 
          SET act_mp = $2, jam_kerja = $3, total_reg_set = $4, oee_rslt = $5 
          WHERE shift = $1 AND DATE(created_dt) = CURRENT_DATE 
          RETURNING *
        `;
        userData = await client.query(updateQuery, [
          shift,
          actMp,
          jamKerja,
          total,
          oee,
        ]);
      } else {
        // Jika data belum ada, lakukan insert
        const insertQuery = `
          INSERT INTO tb_r_oee (shift, act_mp, jam_kerja, total_reg_set, oee_rslt) 
          VALUES ($1, $2, $3, $4, $5) 
          RETURNING *
        `;
        userData = await client.query(insertQuery, [
          shift,
          actMp,
          jamKerja,
          total,
          oee,
        ]);
      }

      client.release();

      //   console.log(userData.rows);

      res.status(201).json({ message: "Success" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed" });
    }
  },
  getOEE: async (req, res) => {
    try {
      // Dapatkan shift dari parameter URL
      const shift = req.params.shift;

      // Dapatkan waktu sekarang dalam timezone Asia/Jakarta
      const now = moment().tz("Asia/Jakarta");

      // Tentukan rentang waktu dari tanggal 18 jam 07:00 hingga tanggal 19 jam 07:00
      const startShift = now
        .clone()
        .subtract(1, "day")
        .startOf("day")
        .add(7, "hours"); // 07:00 hari sebelumnya
      const endShift = now.clone().startOf("day").add(7, "hours"); // 07:00 hari ini

      // Log rentang waktu untuk debugging
      // console.log(
      //   "Rentang waktu shift:",
      //   startShift.format("YYYY-MM-DD HH:mm:ss"),
      //   "sampai",
      //   endShift.format("YYYY-MM-DD HH:mm:ss")
      // );

      // Query untuk mengambil data OEE berdasarkan shift dan rentang waktu
      const q = `SELECT * FROM tb_r_oee WHERE shift = $1 AND created_dt BETWEEN $2 AND $3;`;
      const client = await database.connect();
      const userDataQuery = await client.query(q, [
        shift,
        startShift.format(),
        endShift.format(),
      ]);
      const userData = userDataQuery.rows;
      client.release();

      res.status(200).json({ message: "Success", data: userData });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed" });
    }
  },

  getAbsensi: async (req, res) => {
    try {
      const shift = req.params.shift;
      const client = await database.connect();
      let q;

      // Dapatkan waktu sekarang
      const now = moment().tz("Asia/Jakarta");

      let startShift, endShift;

      if (shift === "Siang") {
        // Shift Siang: 07:00 hingga 20:00 pada hari ini
        startShift = now.clone().startOf("day").add(7, "hours"); // 07:00 hari ini
        endShift = now.clone().startOf("day").add(20, "hours"); // 20:00 hari ini
      } else if (shift === "Malam") {
        // Shift Malam: 20:00 hari kemarin hingga 07:00 hari ini
        startShift = now
          .clone()
          .subtract(1, "day")
          .startOf("day")
          .add(20, "hours"); // 20:00 kemarin
        endShift = now.clone().startOf("day").add(7, "hours"); // 07:00 hari ini
      } else {
        return res.status(400).json({ message: "Shift tidak valid" });
      }

      // Log rentang waktu untuk debugging
      console.log(
        `Rentang waktu Shift ${shift}:`,
        startShift.format("YYYY-MM-DD HH:mm:ss"),
        "hingga",
        endShift.format("YYYY-MM-DD HH:mm:ss")
      );

      // Query untuk mengambil data absensi berdasarkan rentang waktu
      q = `
        SELECT a.*, e.jabatan
        FROM tb_m_absences a
        JOIN tb_m_employees e ON a.employee_id = e.employee_id
        WHERE a.created_dt >= $1
          AND a.created_dt < $2;
      `;

      const absensiDataQuery = await client.query(q, [
        startShift.format(),
        endShift.format(),
      ]);
      const absensiData = absensiDataQuery.rows;
      client.release();

      res.status(200).json({ message: "Success", data: absensiData });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed" });
    }
  },
};
