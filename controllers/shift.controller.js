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
      const currentTime = moment().tz("Asia/Jakarta");
      const hour = currentTime.hour(); // Mendapatkan jam saat ini

      // Tentukan apakah kita masih dalam shift malam hari ini atau sudah berganti hari
      let effectiveDate;
      if (hour >= 0 && hour < 7) {
        // Jika jam antara 00:00 sampai sebelum 07:00, gunakan tanggal kemarin
        effectiveDate = moment(currentTime)
          .subtract(1, "day")
          .format("YYYY-MM-DD");
      } else {
        // Jika jam setelah 07:00, gunakan tanggal hari ini
        effectiveDate = moment(currentTime).format("YYYY-MM-DD");
      }

      // Query untuk mendapatkan shift berdasarkan tanggal yang efektif
      const q = `SELECT today, current_shift FROM tb_m_current_shift WHERE today = '${effectiveDate}';`;

      const client = await database.connect();
      const userDataQuery = await client.query(q);
      const userData = userDataQuery.rows;
      client.release();

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
