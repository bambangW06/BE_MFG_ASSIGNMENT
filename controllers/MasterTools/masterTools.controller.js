var database = require("../../config/storage");
const GET_LAST_ID = require("../../function/GET_LAST_ID");

module.exports = {
  addMasterTool: async (req, res) => {
    try {
      const data = req.body;
      console.log("Request Data:", data);

      const queryLastId = GET_LAST_ID("tool_id", "tb_m_master_tools");

      console.log("Query Last ID:", queryLastId);

      const client = await database.connect(); // Pastikan Anda menggunakan `database.connect()`
      const result = await client.query(queryLastId); // Menjalankan query untuk mendapatkan hasil
      const newId = result.rows[0].new_id; // Mengakses hasil query dengan alias 'new_id'
      console.log("newId", newId); // ID baru setelah penambahan 1

      const insertQuery = `INSERT INTO tb_m_master_tools 
                                (tool_id, line_id, line_nm, op_no, tool_no, process_nm, tool_nm, std_counter) 
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                                RETURNING *`;
      const values = [
        newId,
        data.line_id,
        data.line_nm,
        data.op_no,
        data.tool_no,
        data.process_nm,
        data.tool_nm,
        data.std_counter,
      ];
      console.log("Executing Query:", insertQuery, values);

      const { rows: insertedData } = await client.query(insertQuery, values);
      console.log("Inserted Data:", insertedData);

      client.release();
      console.log("Database connection released");

      res.status(201).json({ message: "success", data: insertedData[0] });
    } catch (error) {
      console.error("Error occurred:", error); // Log error detail
      res
        .status(500)
        .json({ message: "Internal Server Error", error: error.message });
    }
  },
  getMasterTools: async (req, res) => {
    try {
      const q = `SELECT * FROM tb_m_master_tools ORDER BY tool_id DESC`;
      const client = await database.connect();
      const userDataQuery = await client.query(q);
      const userData = userDataQuery.rows;
      client.release();
      res.status(200).json({ message: "success", data: userData });
    } catch (error) {
      console.error("Error fetching employee data:", error);
      res.status(500).json({ message: "Failed to Get Data" });
    }
  },
  editMasterTool: async (req, res) => {
    try {
      const tool_id = req.params.tool_id;
      const data = req.body;

      // Filter data untuk mengabaikan null atau undefined
      const validFields = Object.keys(data).filter(
        (key) => data[key] !== null && data[key] !== undefined
      );

      // Jika tidak ada field yang valid, kirim error
      if (validFields.length === 0) {
        return res.status(400).json({ message: "No valid data to update" });
      }

      // Buat query UPDATE secara dinamis
      const setQuery = validFields
        .map((field, index) => `${field} = $${index + 1}`)
        .join(", ");
      const values = validFields.map((field) => data[field]);
      const query = `UPDATE tb_m_master_tools SET ${setQuery} WHERE tool_id = $${
        validFields.length + 1
      } RETURNING *`;

      // Jalankan query
      const client = await database.connect();
      const userDataQuery = await client.query(query, [...values, tool_id]);
      const userData = userDataQuery.rows;
      client.release();

      // Kirim respon
      res.status(200).json({ message: "success", data: userData[0] });
    } catch (error) {
      console.error("Error updating tool data:", error);
      res.status(500).json({ message: "Failed to Update Data" });
    }
  },
  deleteMasterTool: async (req, res) => {
    try {
      const tool_id = req.params.tool_id;
      const query = `DELETE FROM tb_m_master_tools WHERE tool_id = $1 RETURNING *`;
      const client = await database.connect();
      const userDataQuery = await client.query(query, [tool_id]);
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
