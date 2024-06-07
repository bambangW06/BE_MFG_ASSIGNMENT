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
      let q = `SELECT 
                  abs.*,
                  emp.jabatan,
                  emp.default_position
              FROM 
                  tb_m_absences abs
              JOIN 
                  tb_m_employees emp ON abs.noreg = emp.noreg
              WHERE 
                  abs.date_absence = timezone('Asia/Jakarta', CURRENT_DATE);
              `;

      const client = await database.connect();
      const userDataQuery = await client.query(q);
      // console.log("userDataQuery:", userDataQuery);
      const userData = userDataQuery.rows;
      client.release();
      // console.log("Absen yang dikirim ke frontend:", userData);
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
