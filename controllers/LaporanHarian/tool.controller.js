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

      // Fungsi untuk mendapatkan ID terakhir dan menambah 1
      const getNextId = async (client) => {
        const query = `SELECT MAX(report_id) AS maxId FROM tb_r_regrind_reports`;
        const result = await client.query(query);
        const maxId = result.rows[0].maxid || 0; // Jika tabel kosong, mulai dari 0
        return maxId + 1; // Tambah 1 untuk ID berikutnya
      };

      const client = await database.connect();

      // Mendapatkan ID berikutnya untuk report_id
      const nextReportId = await getNextId(client);

      // Query untuk upsert berdasarkan kombinasi time_range dan tanggal
      const q = `
        INSERT INTO tb_r_regrind_reports (report_id, created_dt, time_range, from_gel, penambahan, reg_set, tool_delay, time_delay)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (time_range, DATE(created_dt)) DO UPDATE
        SET
          from_gel = EXCLUDED.from_gel,
          penambahan = EXCLUDED.penambahan,
          reg_set = EXCLUDED.reg_set,
          tool_delay = EXCLUDED.tool_delay,
          time_delay = EXCLUDED.time_delay
        RETURNING *;
      `;

      const values = [
        nextReportId, // ID yang baru di-generate
        created_dt,
        time_range,
        from_gel,
        penambahan,
        reg_set,
        tool_delay,
        time_delay,
      ];

      const userDataQuery = await client.query(q, values);
      const userData = userDataQuery.rows;
      client.release();

      res.status(201).json({
        message: "Success to Add or Update Data",
        data: userData,
      });
    } catch (error) {
      console.error("Error in addReportReg:", error); // Log error for debugging
      res.status(500).json({
        message: "Failed to Add or Update Data",
        error: error,
      });
    }
  },

  getReportReg: async (req, res) => {
    try {
      const selectedDate = req.query.selectedDate;
      // console.log("tanggalDariFrontEnd", selectedDate);

      // Gunakan tanggal dari front-end jika ada, jika tidak, gunakan hari ini
      const hariIni = selectedDate
        ? moment(selectedDate).tz("Asia/Jakarta").startOf("day").add(7, "hours")
        : moment().tz("Asia/Jakarta").startOf("day").add(7, "hours");

      // Rentang waktu tanpa konversi ke UTC, tetap di timezone Asia/Jakarta
      const mulai = hariIni; // tetap dalam Asia/Jakarta
      const selesai = hariIni.clone().add(1, "day");

      // console.log(
      //   "Rentang waktu (Asia/Jakarta):",
      //   mulai.format("YYYY-MM-DD HH:mm:ss"),
      //   "sampai",
      //   selesai.format("YYYY-MM-DD HH:mm:ss")
      // );

      const q =
        "SELECT * FROM tb_r_regrind_reports WHERE created_dt AT TIME ZONE 'Asia/Jakarta' >= $1 AND created_dt AT TIME ZONE 'Asia/Jakarta' < $2";
      const client = await database.connect();
      const userDataQuery = await client.query(q, [mulai, selesai]);
      const userData = userDataQuery.rows;
      client.release();
      // console.log(userData);

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
