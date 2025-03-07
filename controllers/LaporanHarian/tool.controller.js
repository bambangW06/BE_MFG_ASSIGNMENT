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
        shift,
        time_range,
        from_gel,
        penambahan,
        reg_set,
        tool_delay,
        time_delay,
      } = req.body;

      // Menggunakan moment untuk mendapatkan waktu saat ini di zona waktu "Asia/Jakarta"
      const now = moment().tz("Asia/Jakarta");
      // const now = moment("2024-10-30 20:00:00").tz("Asia/Jakarta");
      const currentHour = now.hour();

      // Menghitung created_dt untuk input data
      const created_dt = now.format("YYYY-MM-DD HH:mm:ss");
      console.log("created_dt:", created_dt);

      // Menentukan rentang waktu untuk pencarian data

      let startDate, endDate;
      if (currentHour >= 7) {
        // Jam 07:00 - 23:59: menggunakan hari ini dari jam 07:00 sampai akhir hari
        startDate = now.format("YYYY-MM-DD 07:00:00");
        endDate = now.format("YYYY-MM-DD 23:59:59");
      } else {
        // Jam 00:00 - 06:59: menggunakan hari kemarin dari jam 07:00 sampai hari ini jam 07:00
        startDate = now.subtract(1, "day").format("YYYY-MM-DD 07:00:00");
        endDate = now.add(1, "day").format("YYYY-MM-DD 07:00:00"); // Mengatur endDate menjadi 07:00 dari hari ini
      }

      console.log("startDate:", startDate);
      console.log("endDate:", endDate);

      // Fungsi untuk mendapatkan ID terakhir dan menambah 1
      const getNextId = async (client) => {
        const query = `SELECT MAX(report_id) AS maxId FROM tb_r_regrind_reports;`;
        const result = await client.query(query);
        const maxId = result.rows[0].maxid || 0; // Jika tabel kosong, mulai dari 0
        return maxId + 1; // Tambah 1 untuk ID berikutnya
      };

      const client = await database.connect();

      // Mendapatkan ID berikutnya untuk report_id
      const nextReportId = await getNextId(client);

      // Query untuk pengecekan data yang sudah ada
      const checkQuery = `SELECT *
        FROM tb_r_regrind_reports
        WHERE time_range = $1
          AND shift = $2
          AND created_dt BETWEEN $3 AND $4
        LIMIT 1;`;
      const checkValues = [time_range, shift, startDate, endDate];
      const existingDataQuery = await client.query(checkQuery, checkValues);

      console.log("existingDataQuery:", existingDataQuery.rows);

      let query;
      let values;

      if (existingDataQuery.rows.length > 0) {
        // Jika data ditemukan, lakukan update (kecuali created_dt)
        query = `UPDATE tb_r_regrind_reports
          SET
            from_gel = $1,
            penambahan = $2,
            reg_set = $3,
            tool_delay = $4,
            time_delay = $5
          WHERE report_id = $6
          RETURNING *;`;

        values = [
          from_gel,
          penambahan,
          reg_set,
          tool_delay,
          time_delay,
          existingDataQuery.rows[0].report_id,
        ];
      } else {
        // Jika data tidak ditemukan, lakukan insert
        query = `INSERT INTO tb_r_regrind_reports (report_id, time_range, from_gel, penambahan, reg_set, tool_delay, time_delay, created_dt, shift)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *;`;

        values = [
          nextReportId,
          time_range,
          from_gel,
          penambahan,
          reg_set,
          tool_delay,
          time_delay,
          created_dt,
          shift,
        ];
      }

      const userDataQuery = await client.query(query, values);
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
      const { selectedDate, shift } = req.query;
      // console.log("selectedDate:", selectedDate);

      // Dapatkan waktu sekarang
      let now = moment().tz("Asia/Jakarta");

      // Jika selectedDate ada, gunakan tanggal tersebut, jika tidak, gunakan waktu sekarang
      let hariIni = selectedDate
        ? moment(selectedDate).tz("Asia/Jakarta").startOf("day")
        : now.clone().startOf("day");
      console.log("hari ini:", hariIni);

      // Variabel untuk menentukan rentang waktu
      let mulai, selesai;

      if (selectedDate) {
        // Jika ada selectedDate, atur mulai dari jam 7 pagi pada tanggal tersebut
        mulai = hariIni.clone().add(7, "hours"); // 07:00 pada selectedDate
        selesai = mulai.clone().add(1, "day"); // 07:00 pada hari berikutnya
      } else {
        // Menentukan shift berdasarkan waktu saat ini
        const currentHour = now.hour();
        if (currentHour < 7) {
          // Sebelum jam 07:00, gunakan tanggal kemarin 07:00 hingga hari ini 07:00
          hariIni.subtract(1, "days");
          mulai = hariIni.clone().add(7, "hours"); // 07:00 kemarin
          selesai = mulai.clone().add(1, "day"); // 07:00 hari ini
        } else {
          // Setelah jam 07:00, gunakan tanggal hari ini 07:00 hingga besok 07:00
          mulai = hariIni.clone().add(7, "hours"); // 07:00 hari ini
          selesai = mulai.clone().add(1, "day"); // 07:00 besok
        }
      }

      console.log(
        "Rentang waktu (Asia/Jakarta):",
        mulai.format("YYYY-MM-DD HH:mm:ss"),
        "sampai",
        selesai.format("YYYY-MM-DD HH:mm:ss")
      );

      const q =
        "SELECT * FROM tb_r_regrind_reports WHERE created_dt AT TIME ZONE 'Asia/Jakarta' >= $1 AND created_dt AT TIME ZONE 'Asia/Jakarta' < $2 AND shift = $3;";
      const client = await database.connect();
      const userDataQuery = await client.query(q, [mulai, selesai, shift]);
      const userData = userDataQuery.rows;
      client.release();
      console.log(userData);

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
