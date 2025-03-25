var database = require("../../config/storage");
const moment = require("moment-timezone");
const GET_LAST_ID = require("../../function/GET_LAST_ID");

module.exports = {
  addMasterOli: async (req, res) => {
    try {
      const { material_no, oil_nm, type_nm, oil_desc, created_by } = req.body;
      console.log("reqbody", req.body);

      const created_dt = moment().format("YYYY-MM-DD HH:mm:ss");

      const queryLastId = GET_LAST_ID("oil_id", "tb_m_oils");
      const client = await database.connect();
      const result = await client.query(queryLastId);
      const newId = result.rows[0].new_id;
      console.log("newId", newId);

      const insertQuery = `INSERT INTO tb_m_oils (oil_id, material_no, oil_nm, type_nm, oil_desc, created_by, created_dt) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
      const values = [
        newId,
        material_no,
        oil_nm,
        type_nm,
        oil_desc,
        created_by,
        created_dt,
      ];
      const oilData = await client.query(insertQuery, values);
      console.log("oilData", oilData);

      const userData = oilData.rows;

      client.release();
      return res.status(201).json({
        message: "Success to Add Data",
        data: userData,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to Add Data",
        error: error.message,
      });
    }
  },
  getMasterOli: async (req, res) => {
    try {
      const q = `SELECT * FROM tb_m_oils ORDER BY oil_id ASC`;
      const client = await database.connect();
      const dataQuery = await client.query(q);
      const data = dataQuery.rows;
      client.release();
      if (data.length > 0) {
        data.forEach((row) => {
          row.display_dt = moment(row.updated_dt || row.created_dt)
            .tz("Asia/Jakarta")
            .format("DD-MM-YYYY");
        });
      }

      res.status(200).json({
        message: "Success to Get Data",
        data: data,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to Get Data",
        error: error.message,
      });
    }
  },
  editMasterOli: async (req, res) => {
    try {
      const oil_id = req.params.oil_id;
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
      data.updated_dt = moment().format("YYYY-MM-DD HH:mm:ss");
      validFields.push("updated_dt"); // tambahkan register_dt secara manual

      console.log("validFields", validFields);

      // Buat query UPDATE secara dinamis
      const setQuery = validFields
        .map((field, index) => `${field} = $${index + 1}`)
        .join(", ");
      const values = validFields.map((field) => data[field]);
      const query = `UPDATE tb_m_oils SET ${setQuery} WHERE oil_id = $${
        validFields.length + 1
      } RETURNING *`;

      // Jalankan query
      const client = await database.connect();
      const userDataQuery = await client.query(query, [...values, oil_id]);
      const userData = userDataQuery.rows;
      client.release();

      // Kirim respon
      res.status(201).json({ message: "success", data: userData[0] });
    } catch (error) {
      console.error("Error fetching employee data:", error);
      res.status(500).json({ message: "Failed to Get Data" });
    }
  },
  deleteMasterOli: async (req, res) => {
    try {
      const oil_id = req.params.oil_id;
      const q = `DELETE FROM tb_m_oils WHERE oil_id = $1`;
      const values = [oil_id];
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
