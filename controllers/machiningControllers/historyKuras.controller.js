var database = require("../../config/storage");
var moment = require("moment-timezone");

module.exports = {
  getHistoryKuras: async (req, res) => {
    try {
      const machineNm = Array.isArray(req.query.machineNm)
        ? req.query.machineNm[0]
        : req.query.machineNm;
      console.log("machineNm", machineNm);
      const q = `
                SELECT 
                    m.line_nm,
                    m.machine_nm,
                    m.last_krs, 
                    m.reason,
                    r.reason_plan
                FROM 
                    tb_m_master_schedules m
                LEFT JOIN 
                    tb_r_schedules r
                ON 
                    m.machine_nm = r.machine_nm
                WHERE 
                    m.machine_nm = $1;
            `;
      const client = await database.connect();
      const userDataQuery = await client.query(q, [machineNm]);
      const userData = userDataQuery.rows;
      client.release();
      if (userData.length > 0) {
        userData.forEach((row) => {
          row.last_krs = moment(row.last_krs)
            .tz("Asia/Jakarta")
            .format("DD-MM-YYYY");
        });
      }
      console.log("userData", userData);
      res.status(201).json({
        message: "Success to Get History Kuras",
        data: userData,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to Get History Kuras",
      });
    }
  },
};
