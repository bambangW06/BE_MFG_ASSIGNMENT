var database = require("../config/database");
module.exports = {
  addDateCheck: async (req, res, next) => {
    try {
      const { schedule_id, machine_id } = req.body;

      if (!schedule_id && !machine_id) {
        return res.status(400).json({
          message: "Machine Id dan Item Check Id dibutuhkan",
        });
      }

      // Lakukan query untuk mendapatkan data dari tb_m_item_checks
      const plantKurasQuery = `
                SELECT 
                    last_krs,
                    period_val
                    period_nm,
                FROM 
                    tb_m_schedules
                WHERE 
                    schedule_id = $1
            `;

      const finalPlan = await database.query(plantKurasQuery, [item_check_id]);

      if (finalPlan.rows.length === 0) {
        return res.status(404).json({
          message: "Item Id Check Not Found",
        });
      }

      const { last_krs, period_val, period_nm } = finalPlan.rows[0];

      // Fungsi untuk mendapatkan tanggal pemeriksaan berdasarkan last_check, period_nm, dan period_val
      const getCheckDate = (last_krs, period_val, period_nm) => {
        const lastCheckDate = new Date(last_krs);

        switch (period_nm) {
          case "Month":
            lastCheckDate.setMonth(
              lastCheckDate.getMonth() + parseInt(period_val) * 1
            );
            break;
          default:
            throw new Error("Periode Tidak Dikenali: " + period_nm);
        }

        return lastCheckDate;
      };

      // Menggunakan fungsi getCheckDate untuk mendapatkan tanggal pemeriksaan
      const calculatedDateCheck = getCheckDate(last_krs, period_nm, period_val);

      // Tambahkan date_check ke req.body
      req.body.date_check = calculatedDateCheck;

      next(); // Lanjut ke fungsi utama
    } catch (error) {
      // Tangani kesalahan jika terjadi
      console.error("Error dalam addDateCheckMiddleware:", error);
      res.status(500).json({
        message: "Failed to Add Date Check",
      });
    }
  },
};
