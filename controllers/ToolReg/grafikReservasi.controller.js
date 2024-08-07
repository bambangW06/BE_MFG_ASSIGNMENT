var database = require("../../config/storage");
var moment = require("moment-timezone");

module.exports = {
  getGrafikReservasi: async (req, res) => {
    try {
      const currenMonth = moment().format("YYYY-MM");
      // console.log("currenMonth", currenMonth);
      const q = `
                  SELECT * FROM tb_m_reservasi 
                  WHERE TO_CHAR(reservasi_dt, 'YYYY-MM') = '${currenMonth}';
                `;

      const client = await database.connect();
      const userDataQuery = await client.query(q);
      const userData = userDataQuery.rows;
      client.release();
      if (userData.length > 0) {
        userData.forEach((row) => {
          row.reservasi_dt = moment(row.reservasi_dt).format("YYYY-MM-DD");
        });
      }

      // console.log("reservasi", userData);
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
