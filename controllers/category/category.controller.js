var database = require("../../config/storage");
module.exports = {
  getCategory: async (req, res) => {
    try {
      const q = "SELECT * FROM tb_m_category";
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
};
