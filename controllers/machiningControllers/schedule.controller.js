var database = require("../../config/storage");
var moment = require("moment-timezone");

module.exports = {
  addScheduleKuras: async (req, res) => {
    try {
      const {
        line_id,
        line_nm,
        machines,
        last_krs,
        shift,
        periodVal,
        periodNm,
      } = req.body;

      if (
        !line_id ||
        !line_nm ||
        !machines ||
        !last_krs ||
        !shift ||
        !periodVal ||
        !periodNm
      ) {
        return res.status(400).json({ message: "Bidang wajib tidak lengkap" });
      }

      const q = `INSERT INTO tb_m_master_schedules (line_id, line_nm, machine_id, machine_nm, last_krs, shift, period_val, period_nm)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`;

      const scheduleData = [];

      const values = [
        line_id,
        line_nm,
        machines.machine_id,
        machines.machine_nm,
        last_krs,
        shift,
        periodVal,
        periodNm,
      ];
      const client = await database.connect();
      const userDataQuery = await client.query(q, values);
      scheduleData.push(userDataQuery.rows[0]);
      client.release();
      res.status(201).json({
        message: "Success to Add Schedule",
        data: scheduleData,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to Add Schedule",
        error: error,
      });
    }
  },

  getScheduleKuras: async (req, res) => {
    const client = await database.connect();
    try {
      let whereCond = "";
      const values = [];

      const machine_nm = req.query.machine_nm;
      if (machine_nm) {
        whereCond = `AND t1.machine_nm LIKE $1`;
        values.push(`%${machine_nm}%`);
      }

      const q = `
        SELECT t1.*
        FROM
          tb_m_master_schedules t1
        INNER JOIN (
          SELECT
            machine_nm,
            MAX(last_krs) AS max_krs
          FROM
            tb_m_master_schedules
          GROUP BY
            machine_nm
        ) t2
        ON
          t1.machine_nm = t2.machine_nm AND
          t1.last_krs = t2.max_krs
        ${whereCond}
        ORDER BY t1.last_krs DESC
      `;

      const scheduleDataQuery = await client.query(q, values);
      const scheduleData = scheduleDataQuery.rows;

      if (scheduleData.length > 0) {
        scheduleData.forEach((row) => {
          row.last_krs = moment(row.last_krs)
            .tz("Asia/Jakarta")
            .format("DD-MM-YYYY");
        });
      }

      res.status(200).json({
        message: "Success to Get Schedule",
        data: scheduleData,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to Get Schedule",
        error: error.message,
      });
    } finally {
      client.release();
    }
  },

  editScheduleKuras: async (req, res) => {
    try {
      const id = req.params.id;
      const {
        line_id,
        line_nm,
        machine_id,
        machines,
        shift,
        periodVal,
        periodNm,
      } = req.body;

      // Validasi input wajib
      if (
        !id ||
        !line_id ||
        !line_nm ||
        !machine_id ||
        !machines ||
        !shift ||
        !periodVal ||
        !periodNm
      ) {
        return res.status(400).json({ message: "Bidang wajib tidak lengkap" });
      }

      // Koneksi ke database
      const client = await database.connect();

      // Buat query untuk mendapatkan data yang ada sebelum diedit
      const currentDataQuery = await client.query(
        `SELECT period_val, period_nm FROM tb_m_master_schedules WHERE schedule_id = $1`,
        [id]
      );
      const currentData = currentDataQuery.rows[0];

      // Inisialisasi array untuk menyimpan kolom yang akan diupdate dan nilai-nilainya
      let columnsToUpdate = [
        "line_id = $1",
        "line_nm = $2",
        "machine_id = $3",
        "machine_nm = $4",
        "shift = $5",
        "period_val = $6",
        "period_nm = $7",
      ];
      let values = [
        line_id,
        line_nm,
        machine_id,
        machines,
        shift,
        periodVal,
        periodNm,
        id, // ID untuk klausa WHERE
      ];

      // Periksa apakah period_val atau period_nm berubah
      if (
        currentData.period_val !== periodVal ||
        currentData.period_nm.toLowerCase() !== periodNm.toLowerCase()
      ) {
        // Tambahkan plan_dt = NULL jika period_val atau period_nm berubah
        columnsToUpdate.push("plan_dt = NULL");
      }

      // Buat query dengan kolom yang akan diupdate
      const q = `UPDATE tb_m_master_schedules
                 SET ${columnsToUpdate.join(", ")}
                 WHERE schedule_id = $8
                 RETURNING *`;

      // Eksekusi query
      const userDataQuery = await client.query(q, values);
      const userData = userDataQuery.rows;
      client.release();

      // Mengirimkan respons ke frontend
      res.status(200).json({
        message: "Success to Edit Data",
        data: userData,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to Edit Data",
        error: error,
      });
    }
  },

  deleteScheduleKuras: async (req, res) => {
    try {
      const id = req.params.id;
      const q = `DELETE FROM tb_m_master_schedules WHERE schedule_id = $1`;
      const client = await database.connect();
      const userDataQuery = await client.query(q, [id]);
      const userData = userDataQuery.rows;
      client.release();
      res.status(201).json({
        message: "Success to Delete Data",
        data: userData,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to Delete Data",
        error: error,
      });
    }
  },
};
