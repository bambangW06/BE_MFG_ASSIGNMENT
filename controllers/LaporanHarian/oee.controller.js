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
      const { shift, date } = req.query;
      // Dapatkan waktu sekarang dalam timezone Asia/Jakarta
      const now = moment().tz("Asia/Jakarta");
      // const now = moment.tz("2024-10-20 07:01", "Asia/Jakarta"); // Simulasi waktu
      // Variabel untuk rentang waktu shift
      let startShift, endShift;

      // Logika untuk mengambil rentang waktu berdasarkan parameter
      if (date) {
        // Jika date ada, gunakan tanggal tersebut
        const selectedDate = moment.tz(date, "Asia/Jakarta");

        if (shift === "Siang") {
          startShift = selectedDate.clone().startOf("day").add(7, "hours"); // 07:00 pada tanggal yang diberikan
          endShift = selectedDate.clone().startOf("day").add(20, "hours"); // 20:00 pada tanggal yang diberikan
        } else if (shift === "Malam") {
          startShift = selectedDate.clone().startOf("day").add(20, "hours"); // 20:00 pada tanggal yang diberikan
          endShift = selectedDate
            .clone()
            .add(1, "day")
            .startOf("day")
            .add(7, "hours"); // 07:00 besok
        } else {
          return res.status(400).json({ message: "Shift tidak valid" });
        }
      } else {
        // Jika date tidak ada, gunakan logika berdasarkan waktu sekarang
        const currentHour = now.hour();

        if (currentHour < 7) {
          // Sebelum jam 7 pagi, gunakan rentang shift dari kemarin jam 7 pagi hingga hari ini jam 7 pagi
          startShift = now
            .clone()
            .subtract(1, "day")
            .startOf("day")
            .add(7, "hours"); // 07:00 kemarin
          endShift = now.clone().startOf("day").add(7, "hours"); // 07:00 hari ini
        } else {
          // Setelah jam 7 pagi, gunakan rentang shift dari hari ini jam 7 pagi hingga besok jam 7 pagi
          startShift = now.clone().startOf("day").add(7, "hours"); // 07:00 hari ini
          endShift = now.clone().add(1, "day").startOf("day").add(7, "hours"); // 07:00 besok
        }
      }

      console.log(
        "Rentang waktu shift:",
        startShift.format("YYYY-MM-DD HH:mm:ss"),
        "sampai",
        endShift.format("YYYY-MM-DD HH:mm:ss")
      );

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
      const { shift, date } = req.query; // Ambil shift dan date dari query
      // console.log("shift :", shift);
      // console.log("date :", date);

      const client = await database.connect();
      let q;

      // Dapatkan waktu sekarang dalam timezone Asia/Jakarta
      const now = moment().tz("Asia/Jakarta");
      // const now = moment.tz("2024-10-20 07:01", "Asia/Jakarta"); // Simulasi waktu

      let startShift, endShift;

      // Logika untuk mengambil data jika date tidak ada
      if (!date || date.trim() === "") {
        if (now.hour() < 7) {
          // Jika sekarang sebelum jam 07:00
          if (shift === "Siang") {
            // Ambil shift siang untuk tanggal kemarin
            startShift = now
              .clone()
              .subtract(1, "days")
              .startOf("day")
              .add(7, "hours"); // 07:00 kemarin
            endShift = now
              .clone()
              .subtract(1, "days")
              .startOf("day")
              .add(20, "hours"); // 20:00 kemarin
          } else if (shift === "Malam") {
            // Ambil shift malam untuk tanggal kemarin hingga hari ini
            startShift = now
              .clone()
              .subtract(1, "days")
              .startOf("day")
              .add(20, "hours"); // 20:00 kemarin
            endShift = now.clone().startOf("day").add(7, "hours"); // 07:00 hari ini
          } else {
            return res.status(400).json({ message: "Shift tidak valid" });
          }
        } else {
          // Jika sekarang setelah jam 07:00
          if (shift === "Siang") {
            // Ambil shift siang untuk hari ini
            startShift = now.clone().startOf("day").add(7, "hours"); // 07:00 hari ini
            endShift = now.clone().startOf("day").add(20, "hours"); // 20:00 hari ini
          } else if (shift === "Malam") {
            // Ambil shift malam untuk hari ini hingga besok
            startShift = now.clone().startOf("day").add(20, "hours"); // 20:00 hari ini
            endShift = now
              .clone()
              .add(1, "days")
              .startOf("day")
              .add(7, "hours"); // 07:00 besok
          } else {
            return res.status(400).json({ message: "Shift tidak valid" });
          }
        }
      } else {
        // Jika date ada, gunakan logika sebelumnya
        const selectedDate = moment.tz(date, "Asia/Jakarta");

        if (shift === "Siang") {
          startShift = selectedDate.clone().startOf("day").add(7, "hours"); // 07:00 pada tanggal yang diberikan
          endShift = selectedDate.clone().startOf("day").add(20, "hours"); // 20:00 pada tanggal yang diberikan
        } else if (shift === "Malam") {
          startShift = selectedDate.clone().startOf("day").add(20, "hours"); // 20:00 pada tanggal yang diberikan
          endShift = selectedDate
            .clone()
            .add(1, "day")
            .startOf("day")
            .add(7, "hours"); // 07:00 besok
        } else {
          return res.status(400).json({ message: "Shift tidak valid" });
        }
      }

      // Log rentang waktu untuk debugging
      // console.log(
      //   `Rentang waktu Shift ${shift}:`,
      //   startShift.format("YYYY-MM-DD HH:mm:ss"),
      //   "hingga",
      //   endShift.format("YYYY-MM-DD HH:mm:ss")
      // );

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
