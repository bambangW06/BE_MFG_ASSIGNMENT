const database = require("../../config/storage");
const moment = require("moment-timezone");

module.exports = {
  getPlanMonth: async (req, res) => {
    try {
      const months = moment().format("YYYY-MM");
      // console.log("Months:", months);
      // let q = `
      //   SELECT *
      //   FROM tb_m_master_schedules
      //   WHERE TO_CHAR(plan_dt, 'YYYY-MM') LIKE $1
      //   ORDER BY plan_dt DESC;
      // `;
      let q = `
        SELECT *
        FROM tb_m_master_schedules;
      `;

      const client = await database.connect();
      const result = await client.query(q);

      client.release();
      if (result.rows.length > 0) {
        result.rows.forEach((row) => {
          row.plan_dt = moment(row.plan_dt)
            .tz("Asia/Jakarta")
            .format("DD-MM-YYYY");
        });
      }
      // console.log(result.rows);
      res.status(200).json({
        message: "Success to Get Plan for Month",
        data: result.rows,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to Get Plan for Month",
        error: error,
      });
    }
  },
  getSearchSchedule: async (req, res) => {
    try {
      let whereCond = ``;
      const machine_nm = req.query.machine_nm;
      // console.log("machine_nm", machine_nm);
      const moment = require("moment-timezone");
      if (machine_nm) {
        // Menggunakan LIKE untuk mencocokkan sebagian dari nilai pada beberapa kolom
        whereCond = `WHERE tb_m_master_schedules.machine_nm LIKE '%${machine_nm}%'`;
      }
      const q = `SELECT DISTINCT ON (machine_nm) *
                  FROM tb_m_master_schedules
                  ${whereCond}
                  ORDER BY machine_nm, plan_dt DESC`;
      const client = await database.connect();
      const scheduleDataQuery = await client.query(q);
      const scheduleData = scheduleDataQuery.rows;
      client.release();
      // Memastikan data tanggal ditangani dengan benar
      if (scheduleData.length > 0) {
        // Konversi tanggal ke zona waktu 'Asia/Jakarta' menggunakan moment-timezone
        scheduleData.forEach((row) => {
          row.plan_dt = moment(row.plan_dt)
            .tz("Asia/Jakarta")
            .format("DD-MM-YYYY");
        });
      }

      // console.log("data dikrim ke FE", scheduleData);
      res.status(200).json({
        message: "Success to Get Schedule",
        data: scheduleData,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to Get Schedule",
        error: error,
      });
    }
  },
  editSearchScheduleKuras: async (req, res) => {
    try {
      const id = req.params.id;
      console.log("idparam", id);

      // Ambil hanya plan_dt dari body request
      const { plan_dt } = req.body;
      console.log("plan_dt", plan_dt);

      // Cek apakah ID ada, jika tidak maka kembalikan error
      if (!id) {
        return res.status(400).json({ message: "ID diperlukan untuk edit" });
      }

      // Cek apakah plan_dt ada, jika tidak maka kembalikan error
      if (!plan_dt) {
        return res
          .status(400)
          .json({ message: "plan_dt diperlukan untuk edit" });
      }

      // Bangun query SQL untuk mengupdate hanya kolom plan_dt di tb_m_master_schedules
      const updateQuery = `UPDATE tb_m_master_schedules
                           SET plan_dt = $1
                           WHERE schedule_id = $2
                           RETURNING *`;

      // Lakukan koneksi dan eksekusi query
      const client = await database.connect();
      const updateResult = await client.query(updateQuery, [plan_dt, id]);

      client.release();

      // Kirim response berhasil
      res.status(200).json({
        message: "Success to Edit Schedule",
        data: updateResult.rows,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to Edit Schedule",
        error: error,
      });
    }
  },
};
