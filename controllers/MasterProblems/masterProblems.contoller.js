var database = require("../../config/storage");
const GET_LAST_ID = require("../../function/GET_LAST_ID");
const moment = require("moment-timezone");

module.exports = {
  addMasterProblem: async (req, res) => {
    try {
      const data = req.body;
      console.log("Request Data:", data);

      const queryLastId = GET_LAST_ID("problem_id", "tb_m_problems");
      const client = await database.connect();
      const result = await client.query(queryLastId);
      const lastId = result.rows[0].new_id;
      console.log("lastId", lastId);

      const insertQuery = `
        INSERT INTO tb_m_problems (problem_id, problem_nm, created_dt, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING *;`;
      const values = [
        lastId,
        data.problem_nm,
        moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss"),
        data.created_by,
      ];
      const { rows: userData } = await client.query(insertQuery, values);
      client.release();

      res.status(201).json({
        message: "Success to Add Data",
        data: userData,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to Add Data",
      });
    }
  },
  getMasterProblems: async (req, res) => {
    try {
      let q = `SELECT * FROM tb_m_problems ORDER BY problem_id ASC`;

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
      });
    }
  },
  editMasterProblem: async (req, res) => {
    try {
      const problem_id = req.params.problem_id;
      const data = req.body;

      // Filter data untuk mengabaikan null atau undefined
      const validFields = Object.keys(data).filter(
        (key) => data[key] !== null && data[key] !== undefined
      );

      // Jika tidak ada field yang valid, kirim error
      if (validFields.length === 0) {
        return res.status(400).json({ message: "No valid data to update" });
      }
      data.updated_dt = moment().format("YYYY-MM-DD HH:mm:ss");
      validFields.push("updated_dt"); // tambahkan register_dt secara manual

      console.log("validFields", validFields);

      /// Buat query UPDATE secara dinamis
      const setQuery = validFields
        .map((field, index) => `${field} = $${index + 1}`)
        .join(", ");
      const values = validFields.map((field) => data[field]);
      const query = `UPDATE tb_m_problems SET ${setQuery} WHERE problem_id = $${
        validFields.length + 1
      } RETURNING *`;

      // Jalankan query
      const client = await database.connect();
      const userDataQuery = await client.query(query, [...values, problem_id]);
      const userData = userDataQuery.rows;
      client.release();

      res.status(201).json({
        message: "Success to Update Data",
        data: userData,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to Update Data",
      });
    }
  },
  deleteMasterProblem: async (req, res) => {
    try {
      const problem_id = req.params.problem_id;

      const client = await database.connect();

      const query = `DELETE FROM tb_m_problems WHERE problem_id = $1 RETURNING *`;

      const { rows: userData } = await client.query(query, [problem_id]);
      client.release();

      res.status(201).json({
        message: "Success to Delete Data",
        data: userData,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to Delete Data",
      });
    }
  },
};
