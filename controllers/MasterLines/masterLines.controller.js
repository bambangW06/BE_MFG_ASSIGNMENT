var database = require("../../config/storage");
const moment = require("moment-timezone");
const GET_LAST_ID = require("../../function/GET_LAST_ID");

module.exports = {
  getLines: async (req, res) => {
    try {
      let q = `SELECT * FROM tb_m_lines ORDER BY line_id ASC`;

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
  addMasterLine: async (req, res) => {
    try {
      const data = req.body;
      console.log("Request Data:", data);
      const queryLastId = GET_LAST_ID("line_id", "tb_m_lines");
      console.log("Query Last ID:", queryLastId);

      const client = await database.connect(); // Pastikan Anda menggunakan `database.connect()`
      const result = await client.query(queryLastId); // Menjalankan query untuk mendapatkan hasil
      const newId = result.rows[0].new_id; // Mengakses hasil query dengan alias 'new_id'
      console.log("newId", newId); // ID baru setelah penambahan 1

      const insertQuery = `INSERT INTO tb_m_lines (line_id, line_nm, line_desc, created_dt, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
      const values = [
        newId,
        data.line_nm,
        data.line_desc,
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
  editMasterLine: async (req, res) => {
    try {
      const line_id = req.params.line_id;
      const data = req.body;

      console.log("data", data);

      // Filter data untuk mengabaikan null atau undefined
      const validFields = Object.keys(data).filter(
        (key) => data[key] !== null && data[key] !== undefined
      );

      // Jika tidak ada field yang valid, kirim error
      if (validFields.length === 0) {
        return res.status(400).json({ message: "No valid data to update" });
      }
      data.changed_dt = moment().format("YYYY-MM-DD HH:mm:ss");
      validFields.push("changed_dt"); // tambahkan register_dt secara manual

      console.log("validFields", validFields);

      // Buat query UPDATE secara dinamis
      const setQuery = validFields
        .map((field, index) => `${field} = $${index + 1}`)
        .join(", ");
      const values = validFields.map((field) => data[field]);
      const query = `UPDATE tb_m_lines SET ${setQuery} WHERE line_id = $${
        validFields.length + 1
      } RETURNING *`;

      // Jalankan query
      const client = await database.connect();
      const userDataQuery = await client.query(query, [...values, line_id]);
      const userData = userDataQuery.rows;
      client.release();

      // Kirim respon
      res.status(200).json({ message: "success", data: userData[0] });
    } catch (error) {
      console.error("Error fetching employee data:", error);
      res.status(500).json({ message: "Failed to Get Data" });
    }
  },
  deleteMasterLine: async (req, res) => {
    try {
      const line_id = req.params.line_id;
      const q = `DELETE FROM tb_m_lines WHERE line_id = $1`;
      const values = [line_id];
      const client = await database.connect();
      const userDataQuery = await client.query(q, values);
      const userData = userDataQuery.rows;
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
