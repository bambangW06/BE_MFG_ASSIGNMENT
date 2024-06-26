var database = require("../../config/storage");
var moment = require("moment-timezone");

module.exports = {
  getGrafikRegrinding: async (req, res) => {
    try {
      const currenMonth = moment().format("MM");
      const currenYear = moment().format("YYYY");
      const q = `SELECT * FROM tb_m_regrinding 
                WHERE EXTRACT(MONTH FROM reg_dt) = $1 
                AND EXTRACT(YEAR FROM reg_dt) = $2;;`;
      const client = await database.connect();
      const userDataQuery = await client.query(q, [currenMonth, currenYear]);
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
