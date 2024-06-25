var database = require("../../config/storage");

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

      for (const machine of machines) {
        const values = [
          line_id,
          line_nm,
          machine.machine_id,
          machine.machine_nm,
          last_krs,
          shift,
          periodVal,
          periodNm,
        ];
        const client = await database.connect();
        const userDataQuery = await client.query(q, values);
        scheduleData.push(userDataQuery.rows[0]);
        client.release();
      }
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
    try {
      let whereCond = ``;
      const machine_nm = req.query.machine_nm;
      // console.log("machine_nm", machine_nm);
      const moment = require("moment-timezone");
      if (machine_nm) {
        // Menggunakan LIKE untuk mencocokkan sebagian dari nilai pada beberapa kolom
        whereCond = `WHERE tb_m_master_schedules.machine_nm LIKE '%${machine_nm}%'`;
      }
      const q = `SELECT * FROM tb_m_master_schedules ${whereCond}`;
      const client = await database.connect();
      const scheduleDataQuery = await client.query(q);
      const scheduleData = scheduleDataQuery.rows;
      client.release();
      // Memastikan data tanggal ditangani dengan benar
      if (scheduleData.length > 0) {
        // Konversi tanggal ke zona waktu 'Asia/Jakarta' menggunakan moment-timezone
        scheduleData.forEach((row) => {
          row.last_krs = moment(row.last_krs)
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
  editScheduleKuras: async (req, res) => {
    try {
      const id = req.params.id;
      // console.log("idparam", id);
      const {
        line_id,
        line_nm,
        machine_id,
        machines,
        last_krs,
        shift,
        periodVal,
        periodNm,
      } = req.body;
      // console.log(
      //   "edit",
      //   line_id,
      //   line_nm,
      //   machine_id,
      //   machines,
      //   last_krs,
      //   shift,
      //   periodVal,
      //   periodNm
      // );

      if (
        !id ||
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
      const q = `UPDATE tb_m_master_schedules
                 SET line_id = $1, line_nm = $2, machine_id = $3, machine_nm = $4, last_krs = $5, shift = $6, period_val = $7, period_nm = $8
                 WHERE schedule_id = $9
                 RETURNING *`;
      const values = [
        line_id,
        line_nm,
        machine_id,
        machines,
        last_krs,
        shift,
        periodVal,
        periodNm,
        id,
      ];
      const client = await database.connect();
      const userDataQuery = await client.query(q, values);
      const userData = userDataQuery.rows;
      client.release();
      res.status(201).json({
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
