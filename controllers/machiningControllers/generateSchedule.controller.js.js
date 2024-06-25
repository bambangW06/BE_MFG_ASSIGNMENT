const database = require("../../config/storage");
const moment = require("moment-timezone");

module.exports = {
  getPlanSchedule: async (req, res) => {
    try {
      const selectQuery = `
        SELECT DISTINCT ON (schedule_id) *
        FROM tb_m_master_schedules
        ORDER BY schedule_id, last_krs DESC
      `;
      const client = await database.connect();
      const plantData = await client.query(selectQuery);

      // Data yang akan digunakan untuk memperbarui plan_dt
      const updateData = [];

      for (const row of plantData.rows) {
        const { last_krs, period_val, period_nm, schedule_id } = row;
        const lastKrsMoment = moment.tz(last_krs, "Asia/Jakarta");
        let plan_dt = lastKrsMoment.clone();

        if (period_nm === "Day") {
          plan_dt.add(period_val, "days");
        } else if (period_nm === "Week") {
          plan_dt.add(period_val, "weeks");
        } else if (period_nm === "Month") {
          plan_dt.add(period_val, "months");
        } else if (period_nm === "Years") {
          plan_dt.add(period_val, "years");
        }

        updateData.push({
          schedule_id: schedule_id,
          plan_dt: plan_dt.format("YYYY-MM-DD"),
        });
      }

      // Batch update untuk mengubah plan_dt di tb_m_master_schedules
      for (const { schedule_id, plan_dt } of updateData) {
        const updateQuery = `
          UPDATE tb_m_master_schedules
          SET plan_dt = $1
          WHERE schedule_id = $2 AND plan_dt IS NULL
        `;
        await client.query(updateQuery, [plan_dt, schedule_id]);
      }

      client.release();
      res.status(200).json({
        message: "Success to Update plan_dt in tb_m_master_schedules",
        data: plantData.rows, // Mengembalikan data yang sudah diambil
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to Update plan_dt in tb_m_master_schedules",
        error: error.message, // Mengembalikan pesan error
      });
    }
  },
};
