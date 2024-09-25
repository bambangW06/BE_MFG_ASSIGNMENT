var database = require("../../config/storage");
module.exports = {
  getSTDCounter: async (req, res) => {
    try {
      const id = req.params.id;
      const q = `SELECT std_counter FROM tb_m_master_tools WHERE std_counter_id = $1`;
      const client = await database.connect();
      const userDataQuery = await client.query(q, [id]);
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
