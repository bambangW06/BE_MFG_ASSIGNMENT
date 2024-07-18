var database = require("../../config/storage");
var moment = require("moment-timezone");

module.exports = {
  addRegrinding: async (req, res) => {
    try {
      const {
        reservasiDate,
        delivery1,
        delivery2,
        delivery3,
        delivery4,
        shift,
      } = req.body;

      // console.log(
      //   reservasiDate,
      //   delivery1,
      //   delivery2,
      //   delivery3,
      //   delivery4,
      //   shift
      // );

      // Parsing nilai delivery dan handling NaN
      const parsedDelivery1 = parseInt(delivery1, 10);
      const parsedDelivery2 = parseInt(delivery2, 10);
      const parsedDelivery3 = parseInt(delivery3, 10);
      const parsedDelivery4 = parseInt(delivery4, 10);

      const deliveryValues = [
        parsedDelivery1,
        parsedDelivery2,
        parsedDelivery3,
        parsedDelivery4,
      ].map((value) => (isNaN(value) ? null : value));

      const q = `
        INSERT INTO tb_m_regrinding (reg_dt, shift, delivery1, delivery2, delivery3, delivery4)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (reg_dt, shift) 
        DO UPDATE SET
            delivery1 = COALESCE(EXCLUDED.delivery1, tb_m_regrinding.delivery1),
            delivery2 = COALESCE(EXCLUDED.delivery2, tb_m_regrinding.delivery2),
            delivery3 = COALESCE(EXCLUDED.delivery3, tb_m_regrinding.delivery3),
            delivery4 = COALESCE(EXCLUDED.delivery4, tb_m_regrinding.delivery4)
        RETURNING *;
      `;

      const client = await database.connect();
      const userDataQuery = await client.query(q, [
        reservasiDate,
        shift,
        deliveryValues[0],
        deliveryValues[1],
        deliveryValues[2],
        deliveryValues[3],
      ]);
      const userData = userDataQuery.rows;
      client.release();

      res.status(201).json({
        message: "Success to Add Data",
        data: userData,
      });
    } catch (error) {
      console.log("Error:", error);
      res.status(500).json({
        message: "Failed to Add Data",
      });
    }
  },

  getRegrinding: async (req, res) => {
    try {
      const shift = req.query.shift;
      const today = moment().tz("Asia/Jakarta").format("YYYY-MM-DD");
      const q = `SELECT * FROM tb_m_regrinding WHERE reg_dt = $1 AND shift = $2;`;
      const client = await database.connect();
      const userDataQuery = await client.query(q, [today, shift]);
      const userData = userDataQuery.rows;
      client.release();
      if (userData.length > 0) {
        userData.forEach((row) => {
          row.reg_dt = moment(row.reg_dt).format("YYYY-MM-DD");
        });
      }
      // console.log("regdate", userData);
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
