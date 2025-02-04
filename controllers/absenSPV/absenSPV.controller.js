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
};
