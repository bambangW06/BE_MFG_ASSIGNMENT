const database = require("../../config/storage");
const moment = require("moment-timezone");

module.exports = {
  getLines: async (req, res) => {
    try {
      const q = "SELECT * FROM tb_m_master_lines ORDER BY line_id ASC";
      const client = await database.connect();
      const userDataQuery = await client.query(q);
      const userData = userDataQuery.rows;
      client.release();
      res.status(200).json({
        message: "success",
        data: userData,
      });
    } catch (error) {
      res.status(500).json({
        message: "error",
      });
    }
  },
  getMachine: async (req, res) => {
    try {
      const line_nm = req.params.line_nm;
      console.log("line_nm", line_nm);
      // Menggunakan DISTINCT untuk menghapus duplikasi
      let q = `SELECT DISTINCT op_no FROM tb_m_master_tools WHERE line_nm = $1 ORDER BY op_no ASC`;

      const client = await database.connect();
      const userDataQuery = await client.query(q, [line_nm]);
      const userData = userDataQuery.rows;
      client.release();

      res.status(200).json({
        message: "success",
        data: userData,
      });
    } catch (error) {
      res.status(500).json({
        message: "error",
      });
    }
  },
};
