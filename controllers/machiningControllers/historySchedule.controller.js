var database = require("../../config/storage");
var moment = require("moment-timezone");

module.exports = {
  addHistorySchedule: async (req, res) => {
    try {
      const {
        scheduleId,
        lineId,
        lineName,
        machineId,
        machineName,
        planShift,
        planReason,
        actualDate,
        status,
      } = req.body;

      // console.log("Data yang diterima dari req.body:", req.body);

      // 1. Insert data ke tb_r_schedules
      let q = `
        INSERT INTO tb_r_schedules (schedule_id, line_id, line_nm, machine_id, machine_nm, shift, reason_plan, actual_dt, status) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
      `;
      const client = await database.connect();
      const userDataQuery = await client.query(q, [
        scheduleId,
        lineId,
        lineName,
        machineId,
        machineName,
        planShift,
        planReason,
        actualDate,
        status,
      ]);
      const userData = userDataQuery.rows;
      client.release();

      if (userData.length > 0) {
        userData[0].plan_dt = moment(userData[0].plan_dt)
          .tz("Asia/Jakarta")
          .format("DD-MM-YYYY");
        userData[0].actual_dt = moment(userData[0].actual_dt)
          .tz("Asia/Jakarta")
          .format("DD-MM-YYYY");

        // 2. Ambil semua kolom dari tb_m_master_schedules berdasarkan schedule_id
        const fetchMasterScheduleQuery = `
          SELECT * 
          FROM tb_m_master_schedules 
          WHERE schedule_id = $1
        `;
        const fetchMasterScheduleResult = await client.query(
          fetchMasterScheduleQuery,
          [scheduleId]
        );

        if (fetchMasterScheduleResult.rows.length > 0) {
          const masterScheduleRow = fetchMasterScheduleResult.rows[0];

          // 3. Buat entri baru di tb_m_master_schedules dengan actualDate sebagai last_krs yang baru
          let insertMasterScheduleQuery = `
            INSERT INTO tb_m_master_schedules ( line_id, line_nm, machine_id, machine_nm, last_krs, shift, period_nm, period_val, reason)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
          `;
          const newLastKrs = actualDate;
          const insertMasterScheduleValues = [
            lineId,
            lineName,
            machineId,
            machineName,
            newLastKrs,
            planShift,
            masterScheduleRow.period_nm,
            masterScheduleRow.period_val,
            masterScheduleRow.reason,
          ];
          const insertedMasterScheduleData = await client.query(
            insertMasterScheduleQuery,
            insertMasterScheduleValues
          );

          res.status(201).json({
            message:
              "Success to Add History Schedule and Create New Master Schedule",
            data: {
              history: userData[0],
              newMaster: insertedMasterScheduleData.rows[0],
            },
          });
        } else {
          throw new Error(
            "No matching record found in tb_m_master_schedules for scheduleId."
          );
        }
      } else {
        throw new Error("Failed to insert data into tb_r_schedules.");
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to Add History Schedule",
        error: error.message,
      });
    }
  },
  getHistorySchedule: async (req, res) => {
    try {
      // SQL query untuk mengambil semua data dari tabel tb_r_schedules
      const q = `SELECT 
      r.*, 
      m.period_val, 
      m.period_nm
    FROM 
      tb_r_schedules r
    LEFT JOIN 
      tb_m_master_schedules m
    ON 
      r.schedule_id = m.schedule_id
    ORDER BY 
      r.actual_dt DESC;`;

      // Koneksi ke database
      const client = await database.connect();
      // Menjalankan query tanpa filter waktu
      const userDataQuery = await client.query(q);
      const userData = userDataQuery.rows;
      // Melepaskan koneksi ke database
      client.release();

      // Memformat tanggal jika data ditemukan
      if (userData.length > 0) {
        userData.forEach((row) => {
          row.actual_dt = moment(row.actual_dt).format("DD-MM-YYYY");
        });
      }

      // Mengirimkan respons ke frontend dengan data yang diambil
      res.status(200).json({
        message: "Success to Get History Schedule",
        data: userData,
      });
    } catch (error) {
      // Menangani error dan mengirimkan respons kegagalan
      console.log(error);
      res.status(500).json({
        message: "Failed to Get History Schedule",
      });
    }
  },
};
