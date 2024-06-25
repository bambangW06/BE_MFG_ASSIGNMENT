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
      console.log(result.rows);
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

      // Ambil payload dari body request
      const { line_id, line_nm, machine_id, machines, plan_dt, shift, reason } =
        req.body;
      console.log(
        "test",
        line_id,
        line_nm,
        machine_id,
        machines,
        plan_dt,
        shift,
        reason
      );
      // Cek apakah ID ada, jika tidak maka kembalikan error
      if (!id) {
        return res.status(400).json({ message: "ID diperlukan untuk edit" });
      }

      // Inisialisasi array untuk menyimpan kolom dan nilai yang akan di-update
      let updateFields = [];
      let values = [];

      // Tambahkan setiap kolom yang ada nilainya ke array
      if (line_id) {
        updateFields.push("line_id = $" + (values.length + 1));
        values.push(line_id);
      }
      if (line_nm) {
        updateFields.push("line_nm = $" + (values.length + 1));
        values.push(line_nm);
      }
      if (machine_id) {
        updateFields.push("machine_id = $" + (values.length + 1));
        values.push(machine_id);
      }
      if (machines) {
        updateFields.push("machine_nm = $" + (values.length + 1));
        values.push(machines);
      }
      if (plan_dt) {
        updateFields.push("plan_dt = $" + (values.length + 1));
        values.push(plan_dt);
      }
      if (shift) {
        updateFields.push("shift = $" + (values.length + 1));
        values.push(shift);
      }
      if (reason) {
        updateFields.push("reason = $" + (values.length + 1));
        values.push(reason);
      }

      // Tambahkan id ke values array untuk digunakan dalam klausa WHERE
      values.push(id);

      // Bangun query SQL
      const q = `UPDATE tb_m_master_schedules
                 SET ${updateFields.join(", ")}
                 WHERE schedule_id = $${values.length}
                 RETURNING *`;

      // Lakukan koneksi dan eksekusi query
      const client = await database.connect();
      const result = await client.query(q, values);
      client.release();
      console.log("result.rows", result.rows);
      // Kirim response berhasil
      res.status(200).json({
        message: "Success to Edit Schedule",
        data: result.rows,
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
