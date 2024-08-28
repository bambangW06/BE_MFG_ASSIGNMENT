var database = require("../../config/storage");

module.exports = {
  async addPosisi(req, res) {
    try {
      const {
        employee_id,
        nama,
        noreg,
        posisi,
        date_assign,
        photourl,
        jabatan,
      } = req.body;

      // Lakukan sesuatu dengan data karyawan (employee)
      const url = new URL(photourl);
      const path = url.pathname;

      // Query untuk menyimpan data ke database
      const q = `INSERT INTO tb_r_position (employee_id, nama, noreg, actual_position, date_assign, photo, jabatan)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (employee_id, date_assign) DO UPDATE 
      SET actual_position = EXCLUDED.actual_position
      RETURNING *`;
      const values = [
        employee_id,
        nama,
        noreg,
        posisi,
        date_assign,
        path,
        jabatan,
      ];

      // Lakukan koneksi ke database dan jalankan query
      const client = await database.connect();
      const userDataQuery = await client.query(q, values);
      const userData = userDataQuery.rows;

      // Kirim respons jika berhasil
      res.status(201).json({
        message: "Data berhasil ditambahkan",
        data: userData, // Tambahkan data yang berhasil disimpan ke respons jika perlu
      });
    } catch (error) {
      console.error("Terjadi kesalahan:", error);
      // Kirim respons jika terjadi kesalahan
      res.status(500).json({
        message: "Gagal menambahkan data karyawan",
      });
    }
  },

  getStatusPos: async (req, res) => {
    try {
      const moment = require("moment-timezone");
      const q = `
            SELECT tb_m_employees.*, absences.status, absences.date_absence
            FROM tb_m_employees
            LEFT JOIN (
                SELECT employee_id, status, date_absence
                FROM tb_m_absences
                WHERE date_absence = date(timezone('Asia/Jakarta', CURRENT_TIMESTAMP))
            ) AS absences ON tb_m_employees.employee_id = absences.employee_id;
        `;
      const client = await database.connect();
      const userDataQuery = await client.query(q);
      const userData = userDataQuery.rows;
      client.release();
      // Memastikan data tanggal ditangani dengan benar
      if (userData.length > 0) {
        // Konversi tanggal ke zona waktu 'Asia/Jakarta' menggunakan moment-timezone
        userData.forEach((row) => {
          row.date_absence = moment(row.date_absence)
            .tz("Asia/Jakarta")
            .format("YYYY-MM-DD");
        });
      }

      res.status(200).json({
        message: "Success to Get Data",
        data: userData,
      });
    } catch (error) {
      console.error("Terjadi kesalahan dalam memproses URL:", error);
      res.status(500).json({
        message: "Failed to get Position",
      });
    }
  },

  getPosition: async (req, res) => {
    try {
      // Pastikan timezone yang digunakan benar
      const moment = require("moment-timezone");

      const q = `
        SELECT * FROM tb_r_position
        WHERE date_assign = date(timezone('Asia/Jakarta', CURRENT_TIMESTAMP));
      `;

      const client = await database.connect();
      const userDataQuery = await client.query(q);
      const userData = userDataQuery.rows;
      client.release();
      // Memastikan data tanggal ditangani dengan benar
      if (userData.length > 0) {
        // Konversi tanggal ke zona waktu 'Asia/Jakarta' menggunakan moment-timezone
        userData.forEach((row) => {
          row.date_assign = moment(row.date_assign)
            .tz("Asia/Jakarta")
            .format("YYYY-MM-DD");
        });
      }
      console.log(
        "Data karyawan yang dikirim ke frontend dari getPosition:",
        userData
      );
      res.status(201).json({
        message: "Success to Get Data",
        data: userData,
      });
    } catch (error) {
      console.error("Terjadi kesalahan dalam memproses URL:", error);
      res.status(500).json({
        message: "Failed to get Position",
      });
    }
  },
};
