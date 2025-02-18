var database = require("../../config/storage");
var moment = require("moment-timezone");

module.exports = {
  getNonShift: async (req, res) => {
    try {
      let q = ` SELECT * FROM tb_m_employees WHERE shift = 'Non Shift' AND jabatan = 'Team Member' `;
      const client = await database.connect();
      const userDataQuery = await client.query(q);
      const userData = userDataQuery.rows;
      client.release();
      res.status(200).json({ message: "success", data: userData });
    } catch (error) {
      console.error("Error fetching employee data:", error);
      res.status(500).json({ message: "Failed to Get Data" });
    }
  },
};
