var database = require("../../config/storage");
var moment = require("moment-timezone");

module.exports = {
  getGrafikRegrinding: async (req, res) => {
    try {
      const q = `SELECT * FROM tb_m_regrinding;`;
      const client = await database.connect();
      const userDataQuery = await client.query(q);
      const userData = userDataQuery.rows;
      client.release();
      if (userData.length > 0) {
        userData.forEach((row) => {
          row.reg_dt = moment(row.reg_dt).format("YYYY-MM-DD");
        });
      }
      res.status(201).json({
        message: "Success to Get Data",
        data: userData,
      });
    } catch (error) {
      console.log("Error:", error);
      res.status(500).json({
        message: "Failed to Get Data",
      });
    }
  },
};
