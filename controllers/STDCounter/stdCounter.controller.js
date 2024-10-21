var database = require("../../config/storage");
module.exports = {
  getSTDCounter: async (req, res) => {
    try {
      const id = req.params.id;

      console.log("id", id);
      const q = `SELECT std_counter FROM tb_m_master_tools WHERE tool_id= $1`;
      const client = await database.connect();
      const userDataQuery = await client.query(q, [id]);
      const userData = userDataQuery.rows;
      client.release();
      console.log("userData", userData);

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
  getTimeRanges: async (req, res) => {
    try {
      const shift = req.params.shift;
      console.log("shift", shift);

      const q = `SELECT * FROM tb_m_time_reports WHERE shift = $1`;
      const values = [shift];
      const client = await database.connect();
      const userDataQuery = await client.query(q, values);
      const userData = userDataQuery.rows;
      client.release();

      console.log("userData", userData);
      res.status(200).json({
        message: "Success to Get Data",
        data: userData,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to Get Data",
        error: error.message, // Kirim pesan error yang lebih jelas
      });
    }
  },
};
