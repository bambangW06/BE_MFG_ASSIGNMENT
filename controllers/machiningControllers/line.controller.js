var database = require("../../config/storage");

module.exports = {
  getLine: async (req, res) => {
    try {
      const q = `SELECT * FROM tb_m_lines`;
      const client = await database.connect();
      const lineDataQuery = await client.query(q);
      const lineData = lineDataQuery.rows;
      client.release();
      res.status(200).json({
        message: "Success to Get Data",
        data: lineData,
      });
    } catch (error) {
      console.error("Error fetching employee data:", error);
      res.status(500).json({
        message: "Failed to Get Data",
      });
    }
  },
};
