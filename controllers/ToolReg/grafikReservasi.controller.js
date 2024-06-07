var database = require("../../config/storage");
var moment = require("moment-timezone");

module.exports = {
  getGrafikReservasi: async (req, res) => {
    try {
      const q = `
                SELECT * FROM tb_m_reservasi `;
      const client = await database.connect();
      const userDataQuery = await client.query(q);
      const userData = userDataQuery.rows;
      client.release();
      if (userData.length > 0) {
        userData.forEach((row) => {
          row.reservasi_dt = moment(row.reservasi_dt).format("YYYY-MM-DD");
        });
      }
      res.status(200).json({
        message: "Success to Get Reservasi",
        data: userData,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to Get Reservasi",
      });
    }
  },
};
