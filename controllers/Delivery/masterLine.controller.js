var database = require("../../config/storage");
const moment = require("moment-timezone");

module.exports = {
  addMasterLine: async (req, res) => {
    try {
      const { line_nm, register_dt, created_by } = req.body;
      console.log(line_nm, register_dt, created_by);

      const q = `INSERT INTO tb_m_master_lines (line_nm, register_dt, created_by) 
                VALUES ($1, $2, $3)
                RETURNING *`;

      const values = [line_nm, register_dt, created_by];
      const client = await database.connect();
      const userDataQuery = await client.query(q, values);

      const userData = userDataQuery.rows;

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
  getMasterLine: async (req, res) => {
    try {
      const q = `SELECT * FROM tb_m_master_lines`;
      const client = await database.connect();
      const userDataQuery = await client.query(q);
      const userData = userDataQuery.rows;
      client.release();
      if (userData.length > 0) {
        userData.forEach((row) => {
          row.register_dt = moment(row.register_dt)
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
  editMasterLine: async (req, res) => {
    try {
      const { line_nm, created_by, line_id } = req.body;
      const register_dt = moment().format("YYYY-MM-DD HH:mm:ss");

      console.log(line_nm, register_dt, created_by, line_id);

      if (!line_nm || !created_by || !line_id) {
        return res.status(400).json({
          message: "Invalid input data",
        });
      }

      const q = `UPDATE tb_m_master_lines SET line_nm = $1, register_dt = $2, created_by = $3 WHERE line_id = $4 RETURNING *`;
      const values = [line_nm, register_dt, created_by, line_id];
      const client = await database.connect();
      const userDataQuery = await client.query(q, values);
      const userData = userDataQuery.rows;

      client.release();

      if (userData.length === 0) {
        return res.status(404).json({
          message: "Data not found",
        });
      }

      res.status(200).json({
        message: "Success to Update Data",
        data: userData,
      });
    } catch (error) {
      console.error("Error updating data:", error);
      res.status(500).json({
        message: "Failed to Update Data",
        error: error.message,
      });
    }
  },
  deleteMasterLine: async (req, res) => {
    try {
      const id = req.params.id;
      const q = `DELETE FROM tb_m_master_lines WHERE line_id = $1`;
      const values = [id];
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
