const database = require("../../config/storage");
const moment = require("moment-timezone");

module.exports = {
  getTools: async (req, res) => {
    try {
      const line_nm = req.params.line_nm;

      const q = "SELECT * FROM tb_m_master_tools WHERE line_nm LIKE $1";
      const client = await database.connect();
      const userDataQuery = await client.query(q, [line_nm]);
      const userData = userDataQuery.rows;
      client.release();
      // console.log(userData);

      res.status(200).json({
        message: "Success to Get Data",
        data: userData,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({
        message: "Failed to Get Data",
      });
    }
  },
  addReportReg: async (req, res) => {
    try {
      const {
        time_range,
        from_gel,
        penambahan,
        reg_set,
        tool_delay,
        time_delay,
      } = req.body;

      const created_dt = new Date(); // Current timestamp

      // Query untuk upsert: insert jika tidak ada, update jika ada konflik pada kombinasi DATE(created_dt) + time_range
      const q = `
        INSERT INTO tb_r_regrind_reports (created_dt, time_range, from_gel, penambahan, reg_set, tool_delay, time_delay)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (time_range)
        DO UPDATE SET
          from_gel = EXCLUDED.from_gel,
          penambahan = EXCLUDED.penambahan,
          reg_set = EXCLUDED.reg_set,
          tool_delay = EXCLUDED.tool_delay,
          time_delay = EXCLUDED.time_delay,
          created_dt = EXCLUDED.created_dt -- Update timestamp if needed
        WHERE DATE(tb_r_regrind_reports.created_dt) = DATE(EXCLUDED.created_dt)
        RETURNING *;
      `;

      const values = [
        created_dt, // Current timestamp
        time_range,
        from_gel,
        penambahan,
        reg_set,
        tool_delay,
        time_delay,
      ];

      const client = await database.connect();
      const userDataQuery = await client.query(q, values);
      const userData = userDataQuery.rows;
      client.release();

      res.status(201).json({
        message: "Success to Add or Update Data",
        data: userData,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to Add or Update Data",
        error: error,
      });
    }
  },

  getReportReg: async (req, res) => {
    try {
      const selectedDate = req.params.selectedDate;
      console.log("tanggalDariFrontEnd", selectedDate);

      // Gunakan tanggal dari front-end jika ada, jika tidak, gunakan hari ini
      const hariIni = selectedDate
        ? moment(selectedDate).tz("Asia/Jakarta").startOf("day").add(7, "hours")
        : moment().tz("Asia/Jakarta").startOf("day").add(7, "hours");

      // Rentang waktu
      const mulai = hariIni; // hari ini jam 07:00
      const selesai = hariIni.clone().add(1, "day"); // besok jam 07:00

      console.log(
        "Rentang waktu:",
        mulai.format("YYYY-MM-DD HH:mm:ss"),
        "sampai",
        selesai.format("YYYY-MM-DD HH:mm:ss")
      );

      const q =
        "SELECT * FROM tb_r_regrind_reports WHERE created_dt BETWEEN $1 AND $2";
      const client = await database.connect();
      const userDataQuery = await client.query(q, [mulai, selesai]);
      const userData = userDataQuery.rows;
      client.release();

      res.status(200).json({
        message: "Success to Get Data",
        data: userData,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to Get Data",
        error: error,
      });
    }
  },
};
