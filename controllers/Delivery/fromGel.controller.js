var database = require("../../config/storage");
var moment = require("moment-timezone");

module.exports = {
  getKanban: async (req, res) => {
    try {
      const today = moment().tz("Asia/Jakarta").format("YYYY-MM-DD");
      const q = `SELECT * FROM tool_request_details WHERE created_at::date = $1;`;
      const client = await database.connect();
      const userDataQuery = await client.query(q, [today]);
      const userData = userDataQuery.rows;
      client.release();
      if (userData.length > 0) {
        userData.forEach((row) => {
          row.created_at = moment(row.created_at)
            .tz("Asia/Jakarta")
            .format("YYYY-MM-DD HH:mm:ss");
        });
      }
      res.status(201).json({
        message: "Success to Get Data",
        data: userData,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to Get Data",
      });
    }
  },

  preparedTools: async (req, res) => {
    try {
      const id = req.params.id;
      const q = `UPDATE tool_request_details SET is_prepared = true WHERE detail_id = $1;`;
      await database.query(q, [id]);
      res.status(200).json({
        message: "Successfully updated",
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to update",
      });
    }
  },
};
