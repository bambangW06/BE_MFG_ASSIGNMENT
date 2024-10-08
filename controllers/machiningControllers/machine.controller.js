var database = require("../../config/storage");

module.exports = {
  getMachines: async (req, res) => {
    try {
      let selectedLine = req.query.line_id;
      console.log("selectedLine", selectedLine);
      selectedLine = parseInt(selectedLine);

      const q = `SELECT * FROM tb_m_machines WHERE root_line_id = ${selectedLine}`;
      // console.log("Query:", q);

      const client = await database.connect();
      const userDataQuery = await client.query(q);
      const userData = userDataQuery.rows;
      client.release();
      // console.log("Data fetched:", userData);
      res.status(200).json({
        message: "Success to Get Data",
        data: userData,
      });
    } catch (error) {
      console.error("Error fetching employee data:", error);
      res.status(500).json({
        message: "Failed to Get Data",
      });
    }
  },

  getMachinesForTMS: async (req, res) => {
    try {
      const q = `SELECT * FROM tb_m_machines`;
      const client = await database.connect();
      const userDataQuery = await client.query(q);
      const userData = userDataQuery.rows;
      client.release();
      // console.log('Data karyawan yang dikirim ke frontend:', userData);
      res.status(200).json({
        message: "Success to Get Data",
        data: userData,
      });
    } catch (error) {
      console.error("Error fetching employee data:", error);
      res.status(500).json({
        message: "Failed to Get Data",
      });
    }
  },
};
