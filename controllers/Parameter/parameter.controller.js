var database = require("../../config/storage");
var moment = require("moment-timezone");
const GET_LAST_ID = require("../../function/GET_LAST_ID");
const {
  getParameter,
} = require("../machiningControllers/parameters.controller");

module.exports = {
  getParameterOptions: async (req, res) => {
    try {
      let q = `SELECT * FROM tb_m_options WHERE deleted_at IS NULL`;
      const client = await database.connect();
      const userDataQuery = await client.query(q);
      const userData = userDataQuery.rows;
      client.release();
      if (userData.length > 0) {
        userData.forEach((row) => {
          row.created_dt = moment(row.created_dt)
            .tz("Asia/Jakarta")
            .format("YYYY-MM-DD");
        });
      }
      res.status(200).json({
        message: "Success to Get Data",
        data: userData,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to Get Data",
        error: error,
      });
    }
  },
  getRangeOptions: async (req, res) => {
    try {
      let q = `SELECT * FROM tb_m_options_ranged`;
      const client = await database.connect();
      const userDataQuery = await client.query(q);
      const userData = userDataQuery.rows;
      client.release();
      res.status(200).json({
        message: "Success to Get Data",
        data: userData,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to Get Data",
        error: error,
      });
    }
  },
  addParamterChecks: async (req, res) => {
    try {
      const data = req.body;
      console.log("data", data);

      // Hitung nilai judge_sts
      data.judge_sts = "";
      const visual = data.visual_nm.toLowerCase();
      const aroma = data.aroma_nm.toLowerCase();

      if (
        (visual === "putih" || visual === "putih kecoklatan") &&
        aroma === "tidak bau"
      ) {
        data.judge_sts = "Normal";
      } else if (
        (visual === "putih" || visual === "putih kecoklatan") &&
        aroma === "bau"
      ) {
        data.judge_sts = "Danger";
      } else if (
        (visual === "coklat" || visual === "coklat tua") &&
        aroma === "tidak bau"
      ) {
        data.judge_sts = "Warning";
      } else if (
        (visual === "coklat" || visual === "coklat tua") &&
        aroma === "bau"
      ) {
        data.judge_sts = "Danger";
      } else {
        data.judge_sts = "Perlu Dicek";
      }

      // Tentukan shift
      const hour = moment().tz("Asia/Jakarta").hour();
      const shift = hour >= 7 && hour < 20 ? "Pagi" : "Malam";
      data.shift = shift;

      const client = await database.connect();

      // Ambil tanggal dari created_dt (formatnya timestamp)
      const createdDateOnly = moment(data.created_dt).format("YYYY-MM-DD");

      // Cek data berdasarkan shift, machine_id, dan tanggal created_dt
      const checkQuery = `
      SELECT check_id 
      FROM tb_r_parameters_check 
      WHERE shift = $1 AND machine_id = $2 AND DATE(created_dt) = $3
    `;
      const checkValues = [data.shift, data.machine_id, createdDateOnly];
      const checkResult = await client.query(checkQuery, checkValues);

      if (checkResult.rows.length > 0) {
        // UPDATE
        const existingId = checkResult.rows[0].check_id;

        const updateQuery = `
        UPDATE tb_r_parameters_check SET
          machine_nm = $1,
          visual_nm = $2,
          aroma_nm = $3,
          sludge_nm = $4,
          cons_val = $5,
          ph_val = $6,
          judge_sts = $7,
          created_dt = $8,
          pic_check = $9
        WHERE check_id = $10
        RETURNING *
      `;
        const updateValues = [
          data.machine_nm,
          data.visual_nm,
          data.aroma_nm,
          data.sludge_nm,
          data.cons_val,
          data.ph,
          data.judge_sts,
          data.created_dt,
          data.pic,
          existingId,
        ];

        const { rows: updatedRows } = await client.query(
          updateQuery,
          updateValues
        );
        client.release();
        console.log("updatedRows", updatedRows);

        res.status(200).json({
          message: "Data updated successfully",
          data: updatedRows[0],
        });
      } else {
        // INSERT
        const queryLastId = GET_LAST_ID("check_id", "tb_r_parameters_check");
        const result = await client.query(queryLastId);
        const newId = result.rows[0].new_id;

        const insertQuery = `
        INSERT INTO tb_r_parameters_check 
        (check_id, shift, machine_id, machine_nm, visual_nm, aroma_nm, sludge_nm, cons_val, ph_val, created_dt, judge_sts, pic_check)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
        const insertValues = [
          newId,
          data.shift,
          data.machine_id,
          data.machine_nm,
          data.visual_nm,
          data.aroma_nm,
          data.sludge_nm,
          data.cons_val,
          data.ph,
          data.created_dt,
          data.judge_sts,
          data.pic,
        ];

        const { rows: insertedRows } = await client.query(
          insertQuery,
          insertValues
        );
        client.release();

        res.status(200).json({
          message: "Data inserted successfully",
          data: insertedRows[0],
        });
      }
    } catch (error) {
      console.error("addParamterChecks error:", error);
      res.status(500).json({
        message: "Failed to add/update Data",
        error: error.message,
      });
    }
  },

  getParameterCheckResult: async (req, res) => {
    try {
      const now = moment().tz("Asia/Jakarta");
      // const now = moment.tz("2025-05-17 07:00", "Asia/Jakarta");

      const startOfShift = moment(now)
        .tz("Asia/Jakarta")
        .startOf("day")
        .add(7, "hours"); // hari ini jam 07:00
      let start, end;

      if (now.hour() >= 7 && now.hour() < 20) {
        // Shift pagi: 07:00 - 19:59 → ambil data dari hari ini jam 07:00 sampai besok jam 07:00
        start = moment(startOfShift);
        end = moment(startOfShift).add(1, "day");
      } else {
        // Shift malam: 20:00 - 06:59 → ambil data dari hari ini jam 07:00 sampai besok jam 07:00
        start = moment(startOfShift);
        end = moment(startOfShift).add(1, "day");
      }

      const q = `
      SELECT * FROM tb_r_parameters_check 
      WHERE created_dt BETWEEN $1 AND $2
      ORDER BY created_dt ASC;
    `;

      const client = await database.connect();
      const userDataQuery = await client.query(q, [
        start.toISOString(),
        end.toISOString(),
      ]);
      const userData = userDataQuery.rows;
      client.release();

      // Format created_dt kembali ke string lokal
      if (userData.length > 0) {
        userData.forEach((row) => {
          row.created_dt = moment(row.created_dt)
            .tz("Asia/Jakarta")
            .format("YYYY-MM-DD HH:mm:ss");
        });
      }

      res.status(201).json({
        message: "Success to Get Data",
        data: userData,
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({
        message: "Failed to Get Data",
      });
    }
  },
};
