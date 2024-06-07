const database = require("../../config/storage");
const moment = require("moment-timezone");

module.exports = {
  getPlanSchedule: async (req, res) => {
    try {
      // const months = moment().format("YYYY-MM");
      // console.log("Months:", months);

      // // Menghitung next_months
      // const next_months = moment().add(1, "months").format("YYYY-MM");

      let q = `SELECT * FROM tb_m_master_schedules`;

      const client = await database.connect();
      const plantData = await client.query(q);

      // Proses data untuk menambahkan kolom plan_dt
      const processedData = plantData.rows.map((row) => {
        const { last_krs, period_val, period_nm } = row;
        // Menggunakan moment untuk mengonversi last_krs ke zona waktu 'Asia/Jakarta'
        const lastKrsMoment = moment.tz(last_krs, "Asia/Jakarta");

        let plan_dt = lastKrsMoment.clone(); // Clone untuk membuat objek baru yang tidak terikat ke lastKrsMoment

        if (period_nm === "Day") {
          plan_dt.add(period_val, "days");
        } else if (period_nm === "Week") {
          plan_dt.add(period_val, "weeks");
        } else if (period_nm === "Month") {
          plan_dt.add(period_val, "months");
        } else if (period_nm === "Years") {
          plan_dt.add(period_val, "years");
        }

        // Format tanggal ke string ISO atau format lain yang Anda inginkan (opsional)
        row.last_krs = lastKrsMoment.format("YYYY-MM-DD");
        row.plan_dt = plan_dt.format("YYYY-MM-DD");
        return row;
      });

      // Log processed data untuk debugging
      console.log("Processed Data:", processedData);

      // Insert processed data into a new table or update existing table
      for (const row of processedData) {
        let insertQuery = `
          INSERT INTO tb_r_schedules (schedule_id, line_id, line_nm, machine_id, machine_nm, last_krs, plan_dt, shift)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        await client.query(insertQuery, [
          row.schedule_id,
          row.line_id,
          row.line_nm,
          row.machine_id,
          row.machine_nm,
          row.last_krs,
          row.plan_dt,
          row.shift,
        ]);
      }

      client.release();
      res.status(200).json({
        message: "Success to Get Plant",
        data: processedData,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to Get Plant",
        error: error,
      });
    }
  },
};
