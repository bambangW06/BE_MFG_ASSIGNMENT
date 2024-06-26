var database = require("../../config/storage");
var moment = require("moment-timezone");

module.exports = {
  addRegrinding: async (req, res) => {
    try {
      const { reservasiDate, morning, afterlunch, shift } = req.body;
      console.log(reservasiDate, morning, afterlunch, shift);

      const parsedMorning =
        morning !== undefined && morning !== "" ? parseInt(morning, 10) : null;
      const parsedAfterlunch =
        afterlunch !== undefined && afterlunch !== ""
          ? parseInt(afterlunch, 10)
          : null;

      const q = `
          INSERT INTO tb_m_regrinding (reg_dt, morning_ses, afterlunch_ses, shift)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (reg_dt, shift) 
          DO UPDATE SET
              morning_ses = COALESCE(EXCLUDED.morning_ses, tb_m_regrinding.morning_ses),
              afterlunch_ses = COALESCE(EXCLUDED.afterlunch_ses, tb_m_regrinding.afterlunch_ses)
          RETURNING *;
          `;

      const client = await database.connect();
      const userDataQuery = await client.query(q, [
        reservasiDate,
        parsedMorning,
        parsedAfterlunch,
        shift,
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
      const regDate = moment().tz("Asia/Jakarta").format("YYYY-MM-DD");
      const q = `SELECT * FROM tb_m_regrinding WHERE reg_dt = $1 AND shift = $2;`;
      const client = await database.connect();
      const userDataQuery = await client.query(q, [regDate, shift]);
      const userData = userDataQuery.rows;
      client.release();
      if (userData.length > 0) {
        userData.forEach((row) => {
          row.reg_dt = moment(row.reg_dt).format("YYYY-MM-DD");
        });
      }
      console.log("regdate", userData);
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
