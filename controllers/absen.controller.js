var database = require("../config/storage");

module.exports = {
  addAbsence: async (req, res) => {
    try {
      const { employee_id, nama, noreg, dateAbsence, status, currentShift } =
        req.body;

      const q = `
            INSERT INTO tb_m_absences (employee_id, nama, noreg, date_absence, status, current_shift) 
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (employee_id, date_absence) DO UPDATE
            SET status = EXCLUDED.status, current_shift = EXCLUDED.current_shift
            WHERE tb_m_absences.date_absence = EXCLUDED.date_absence;

        `;

      const values = [
        employee_id,
        nama,
        noreg,
        dateAbsence,
        status,
        currentShift,
      ];
      const client = await database.connect();
      const userDataQuery = await client.query(q, values);
      const userData = userDataQuery.rows;
      client.release();

      // Tentukan apakah operasi ini merupakan penambahan atau pembaruan
      const message = userDataQuery.rowCount
        ? "Success to Update Absence"
        : "Success to Add Absence";

      res.status(201).json({
        message: message,
        data: userData,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to Add or Update Absence",
      });
    }
  },
  getAbsen: async (req, res) => {
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

      let q = `SELECT 
                  abs.*,
                  emp.jabatan,
                  emp.default_position
              FROM 
                  tb_m_absences abs
              JOIN 
                  tb_m_employees emp ON abs.noreg = emp.noreg
              WHERE 
                  abs.date_absence = $1;`; // Menggunakan parameterized query dengan $1

      const client = await database.connect();
      const userDataQuery = await client.query(q, [effectiveDate]); // Memasukkan effectiveDate sebagai parameter
      const userData = userDataQuery.rows;
      client.release();

      res.status(200).json({
        message: "Success to Get Absence",
        data: userData,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to Get Absence",
      });
    }
  },
};
