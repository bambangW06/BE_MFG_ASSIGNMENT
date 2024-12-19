var database = require("../../config/storage");
const moment = require("moment-timezone");
const GET_LAST_ID = require("../../function/GET_LAST_ID");

module.exports = {
  getTimerange: async (req, res) => {
    try {
      let q = `SELECT * FROM tb_m_time_reports ORDER BY time_id ASC`;

      const client = await database.connect();
      const userDataQuery = await client.query(q);
      const userData = userDataQuery.rows;
      client.release();

      if (userData.length > 0) {
        userData.forEach((row) => {
          row.created_dt = moment(row.created_dt)
            .tz("Asia/Jakarta")
            .format("DD-MM-YYYY");
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
  addTimerange: async (req, res) => {
    try {
      const { shift, time_range } = req.body;
      console.log("req.body", shift, time_range);
      const created_dt = moment()
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");

      const queryLastId = GET_LAST_ID("time_id", "tb_m_time_reports");
      console.log("queryLastId", queryLastId);

      const client = await database.connect(); // Pastikan Anda menggunakan `database.connect()`
      const result = await client.query(queryLastId); // Menjalankan query untuk mendapatkan hasil
      const newId = result.rows[0].new_id; // Mengakses hasil query dengan alias 'new_id'
      console.log("newId", newId); // ID baru setelah penambahan 1

      // Masukkan data baru
      const insertQuery = `
        INSERT INTO tb_m_time_reports (time_id, shift, time_range, created_dt)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      const values = [newId, shift, time_range, created_dt];

      const { rows: insertedData } = await client.query(insertQuery, values);
      client.release();

      res.status(201).json({
        message: "Success to Add Data",
        data: insertedData[0],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to Add Data",
        error: error.message,
      });
    }
  },
  editTimerange: async (req, res) => {
    try {
      const { time_id, shift, time_range } = req.body;
      console.log("req.body", time_id, shift, time_range);

      const client = await database.connect(); // Pastikan Anda menggunakan `database.connect()`
      const result = await client.query(
        `SELECT * FROM tb_m_time_reports WHERE time_id = $1`,
        [time_id]
      ); // Menjalankan query untuk mendapatkan hasil
      const data = result.rows[0]; // Mengakses hasil query dengan alias 'new_id'
      console.log("data", data);

      // Masukkan data baru
      const insertQuery = `
        UPDATE tb_m_time_reports
        SET shift = $1, time_range = $2
        WHERE time_id = $3
        RETURNING *;
      `;
      const values = [shift, time_range, time_id];

      const { rows: insertedData } = await client.query(insertQuery, values);
      client.release();

      res.status(201).json({
        message: "Success to Edit Data",
        data: insertedData[0],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to Add Data",
        error: error.message,
      });
    }
  },
  deleteTimerange: async (req, res) => {
    try {
      const time_id = req.params.time_id;
      const q = `DELETE FROM tb_m_time_reports WHERE time_id = $1`;
      const client = await database.connect();
      const userDataQuery = await client.query(q, [time_id]);
      const userData = userDataQuery.rows;
      client.release();

      res.status(200).json({
        message: "Success to Delete Data",
        data: userData,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to Delete Data",
        error: error,
      });
    }
  },
};
