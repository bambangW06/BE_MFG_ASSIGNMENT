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
      const shift = req.params.shift;

      //   console.log("shift", shift);
      const q = `SELECT * FROM tb_r_oee WHERE shift = $1 AND DATE(created_dt) = CURRENT_DATE;`;
      const client = await database.connect();
      const userDataQuery = await client.query(q, [shift]);
      const userData = userDataQuery.rows;
      client.release();
      //   console.log("userData", userData);

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

      if (shift === "Siang") {
        // Shift Siang: 07:00 hingga 20:00 hari ini
        q = `
          SELECT a.*, e.jabatan
          FROM tb_m_absences a
          JOIN tb_m_employees e ON a.employee_id = e.employee_id
          WHERE a.created_dt >= CURRENT_DATE + INTERVAL '7 hours'
            AND a.created_dt < CURRENT_DATE + INTERVAL '20 hours';
        `;
      } else if (shift === "Malam") {
        // Shift Malam: 20:00 hari ini hingga 07:00 besok
        q = `
          SELECT a.*, e.jabatan
          FROM tb_m_absences a
          JOIN tb_m_employees e ON a.employee_id = e.employee_id
          WHERE a.created_dt >= CURRENT_DATE + INTERVAL '20 hours'
            AND a.created_dt < (CURRENT_DATE + INTERVAL '1 day') + INTERVAL '7 hours';
        `;
      } else {
        return res.status(400).json({ message: "Invalid shift" });
      }

      const absensiDataQuery = await client.query(q);
      const absensiData = absensiDataQuery.rows;
      client.release();

      res.status(200).json({ message: "Success", data: absensiData });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed" });
    }
  },
};
