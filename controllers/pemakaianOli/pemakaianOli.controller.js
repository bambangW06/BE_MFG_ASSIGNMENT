const database = require("../../config/storage");
const moment = require("moment-timezone");
const GET_LAST_ID = require("../../function/GET_LAST_ID");

module.exports = {
  addPemakaianOli: async (req, res) => {
    try {
      const data = req.body;
      // console.log("Request Data:", data);

      const lastUseageId = GET_LAST_ID("usage_id", "tb_r_oil_usage");
      const client = await database.connect();
      const result = await client.query(lastUseageId);
      const newId = result.rows[0].new_id;
      let q = `INSERT INTO tb_r_oil_usage (usage_id, oil_id, oil_nm, type_nm, machine_id, machine_nm, 
                oil_volume, pic, created_dt, note_id, note_nm) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`;
      const values = [
        newId,
        data.oil_id,
        data.oil_nm,
        data.type_nm,
        data.machine_id,
        data.machine_nm,
        data.oil_volume,
        data.pic,
        data.created_dt,
        data.note_id,
        data.note_nm,
      ];
      const resultInsert = await client.query(q, values);
      const dataInsert = resultInsert.rows;
      client.release();
      res
        .status(201)
        .json({ message: "Success to Get Data", data: dataInsert });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to Get Data", error: error.message });
    }
  },
  getMachines: async (req, res) => {
    try {
      let q = `
        SELECT * FROM tb_m_machines
        ;
      `;

      const client = await database.connect();
      const result = await client.query(q);
      client.release();

      // Hasil langsung berupa array tanpa nested object
      let formattedData = result.rows;

      res.status(200).json({ message: "success", data: formattedData });
    } catch (error) {
      console.error("Error fetching machine data:", error);
      res.status(500).json({ message: "Failed to Get Data" });
    }
  },
  getPemakaianOli: async (req, res) => {
    try {
      // Ambil waktu saat request dilakukan
      const now = moment().tz("Asia/Jakarta");
      // console.log("now", now);
      let todayStart, tomorrowStart;

      // Cek apakah request dilakukan sebelum jam 07:00 (dini hari)
      if (now.hour() < 7) {
        // Jika sebelum jam 07:00, ambil data dari kemarin jam 07:00 hingga hari ini jam 07:00
        todayStart = now
          .clone()
          .subtract(1, "day")
          .startOf("day")
          .add(7, "hours");
        tomorrowStart = todayStart.clone().add(1, "day");
      } else {
        // Jika setelah jam 07:00, ambil data dari hari ini jam 07:00 hingga besok jam 07:00
        todayStart = now.clone().startOf("day").add(7, "hours");
        tomorrowStart = todayStart.clone().add(1, "day");
      }

      // console.log(
      //   "Hari ini jam 07:00:",
      //   todayStart.format("YYYY-MM-DD HH:mm:ss")
      // );
      // console.log(
      //   "Besok jam 07:00:",
      //   tomorrowStart.format("YYYY-MM-DD HH:mm:ss")
      // );

      let q = `
        SELECT * FROM tb_r_oil_usage
        WHERE created_dt BETWEEN $1 AND $2
      `;

      const client = await database.connect();
      const result = await client.query(q, [
        todayStart.format("YYYY-MM-DD HH:mm:ss"),
        tomorrowStart.format("YYYY-MM-DD HH:mm:ss"),
      ]);
      client.release();

      // console.log("Result:", result.rows);
      res.status(200).json({ message: "success", data: result.rows });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Failed to Get Data" });
    }
  },
};
