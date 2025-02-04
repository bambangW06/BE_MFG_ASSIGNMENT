var database = require("../../config/storage");
const moment = require("moment-timezone");

module.exports = {
  getAbsenSPV: async (req, res) => {
    try {
      const today = moment().tz("Asia/Jakarta").format("YYYY-MM-DD");

      let query = `
        SELECT 
          emp.*, 
          abs.status
        FROM tb_m_employees emp
        LEFT JOIN tb_m_absences abs 
          ON emp.employee_id = abs.employee_id 
          AND DATE(abs.created_dt) = $1
          AND EXTRACT(HOUR FROM abs.created_dt) BETWEEN 7 AND 19
        WHERE emp.jabatan = 'Supervisor';
      `;

      const result = await database.query(query, [today]);

      res.status(200).json({
        message: "Berhasil mengambil data absensi SPV.",
        data: result.rows,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Terjadi kesalahan saat mengambil data absensi SPV.",
      });
    }
  },

  getHistoryAbsensi: async (req, res) => {
    const client = await database.connect(); // ⬅️ Pakai client connect
    try {
      let selectedMonth = req.query.selectedMonth || moment().format("YYYY-MM");
      console.log("Selected Month:", selectedMonth);

      // Ambil Supervisor (hanya 1)
      const supervisorQuery = `SELECT employee_id FROM tb_m_employees WHERE jabatan = 'Supervisor'`;
      const supervisorResult = await client.query(supervisorQuery);
      const supervisor = supervisorResult.rows[0]; // ⬅️ Ambil data pertama

      const supervisorId = supervisor.employee_id;

      // Ambil data absensi berdasarkan employee_id dan selectedMonth
      const absenceQuery = `
            SELECT * 
            FROM tb_m_absences 
            WHERE employee_id = $1 
            AND TO_CHAR(date_absence, 'YYYY-MM') = $2
        `;
      const absencesResult = await client.query(absenceQuery, [
        supervisorId,
        selectedMonth,
      ]);
      const absences = absencesResult.rows; // ⬅️ Ambil semua hasil query

      // Kelompokkan data menjadi 'hadir' dan 'selainHadir'
      const hadir = absences.filter((abs) => abs.status === "Hadir");
      const selainHadir = absences.filter((abs) => abs.status !== "Hadir");

      client.release(); // ⬅️ Release client setelah query selesai

      res.status(200).json({
        message: "Berhasil mengambil data absensi.",
        data: { hadir, selainHadir },
      });
    } catch (error) {
      console.error("Error getHistoryAbsensi:", error);
      res.status(500).json({ message: "Terjadi kesalahan server." });
    }
  },
};
