var database = require("../config/storage");

module.exports = {
  addShift: async (req, res) => {
    try {
      const shift = req.body.shift;
      const localTime = req.body.localTime;

      //   console.log("Data yang diterima dari req.body:", shift, localTime);
      const q = `INSERT INTO tb_m_current_shift (today, current_shift)
            VALUES ($1, $2)
            ON CONFLICT (today)
            DO UPDATE SET current_shift = EXCLUDED.current_shift
            RETURNING *;
            `;
      const values = [localTime, shift];
      const client = await database.connect();
      const userDataQuery = await client.query(q, values);
      const userData = userDataQuery.rows;
      client.release();
      res.status(201).json({
        message: "Success to Add Shift",
        data: userData,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to Add Shift",
      });
    }
  },

  getShift: async (req, res) => {
    try {
      const moment = require("moment-timezone");
      // Query untuk mendapatkan tanggal hari ini dalam zona waktu 'Asia/Jakarta'
      const q = `SELECT today, current_shift FROM tb_m_current_shift WHERE today = date(timezone('Asia/Jakarta', CURRENT_TIMESTAMP));`;
      console.log("Query yang dijalankan:", q);

      const client = await database.connect();
      const userDataQuery = await client.query(q);
      const userData = userDataQuery.rows;
      client.release();

      // Memastikan data tanggal ditangani dengan benar
      if (userData.length > 0) {
        // Konversi tanggal ke zona waktu 'Asia/Jakarta' menggunakan moment-timezone
        userData.forEach((row) => {
          row.today = moment(row.today).tz("Asia/Jakarta").format("YYYY-MM-DD");
        });
      }

      // console.log("Data karyawan yang dikirim ke frontend getShift:", userData);

      res.status(200).json({
        message: "Success to Get Shift",
        data: userData,
      });
    } catch (error) {
      console.log("Error:", error);
      res.status(500).json({
        message: "Failed to Get Shift",
      });
    }
  },
};
