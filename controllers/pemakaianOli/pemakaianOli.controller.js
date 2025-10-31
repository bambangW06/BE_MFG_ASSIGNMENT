const database = require("../../config/storage");
const moment = require("moment-timezone");
const GET_LAST_ID = require("../../function/GET_LAST_ID");

module.exports = {
  // addPemakaianOli: async (req, res) => {
  //   try {
  //     const data = req.body;
  //     console.log("data", data);

  //     const client = await database.connect();

  //     const lastUsageId = GET_LAST_ID("usage_id", "tb_r_oil_usage");
  //     const result = await client.query(lastUsageId);
  //     const newId = result.rows[0].new_id;

  //     // 🔹 Cek apakah data mixing (tidak ada machine_id tapi ada line_id)
  //     let q = "";
  //     let values = [];

  //     if (data.line_id && !data.machine_id) {
  //       // === CASE: MIXING REGULER ===
  //       q = `
  //       INSERT INTO tb_r_oil_usage (
  //         usage_id, oil_id, oil_nm, type_nm,
  //          oil_volume, pic, created_dt,
  //         note_id, note_nm, line_id, shift_type
  //       )
  //       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
  //       RETURNING *
  //     `;
  //       values = [
  //         newId,
  //         data.oil_id,
  //         data.oil_nm,
  //         data.type_nm,
  //         data.oil_volume,
  //         data.pic,
  //         data.created_dt,
  //         data.note_id,
  //         data.note_nm,
  //         data.line_id,
  //         data.shift,
  //       ];
  //     } else {
  //       // === CASE: PEMAKAIAN BIASA ===
  //       q = `
  //       INSERT INTO tb_r_oil_usage (
  //         usage_id, oil_id, oil_nm, type_nm,
  //         machine_id, machine_nm, oil_volume,
  //         pic, created_dt, note_id, note_nm,shift_type
  //       )
  //       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
  //       RETURNING *
  //     `;
  //       values = [
  //         newId,
  //         data.oil_id,
  //         data.oil_nm,
  //         data.type_nm,
  //         data.machine_id,
  //         data.machine_nm,
  //         data.oil_volume,
  //         data.pic,
  //         data.created_dt,
  //         data.note_id,
  //         data.note_nm,
  //         data.shift,
  //       ];
  //     }

  //     const resultInsert = await client.query(q, values);
  //     const dataInsert = resultInsert.rows;
  //     client.release();

  //     res.status(201).json({
  //       message: "Success to Insert Data",
  //       data: dataInsert,
  //     });
  //   } catch (error) {
  //     console.error("Error addPemakaianOli:", error);
  //     res.status(500).json({
  //       message: "Failed to Insert Data",
  //       error: error.message,
  //     });
  //   }
  // },

  addPemakaianOli: async (req, res) => {
    try {
      const data = req.body;
      console.log("data", data);

      const client = await database.connect();
      const todayDate = data.created_dt.split("T")[0]; // YYYY-MM-DD

      // === CASE: MIXING REGULER ===
      if (data.line_id && !data.machine_id) {
        const checkQuery = `
        SELECT usage_id FROM tb_r_oil_usage
        WHERE line_id = $1
          AND oil_id = $2
          AND note_nm = $3
          AND CAST(created_dt AS DATE) = $4
      `;
        const checkResult = await client.query(checkQuery, [
          data.line_id,
          data.oil_id,
          data.note_nm,
          todayDate,
        ]);

        if (checkResult.rowCount > 0) {
          // === UPDATE ===
          const usageId = checkResult.rows[0].usage_id;
          const updateQuery = `
          UPDATE tb_r_oil_usage
          SET oil_volume = $1,
              pic = $2
          WHERE usage_id = $3
          RETURNING *;
        `;
          const updated = await client.query(updateQuery, [
            data.oil_volume,
            data.pic,
            usageId,
          ]);
          client.release();
          return res.status(201).json({
            message: "Data updated (mixing)",
            data: updated.rows,
          });
        } else {
          // === INSERT baru ===
          const lastUsageId = GET_LAST_ID("usage_id", "tb_r_oil_usage");
          const result = await client.query(lastUsageId);
          const newId = result.rows[0].new_id;

          const insertQuery = `
          INSERT INTO tb_r_oil_usage (
            usage_id, oil_id, oil_nm, type_nm,
            oil_volume, pic, created_dt,
            note_id, note_nm, line_id, shift_type
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
          RETURNING *;
        `;
          const inserted = await client.query(insertQuery, [
            newId,
            data.oil_id,
            data.oil_nm,
            data.type_nm,
            data.oil_volume,
            data.pic,
            data.created_dt,
            data.note_id,
            data.note_nm,
            data.line_id,
            data.shift,
          ]);
          client.release();
          return res.status(201).json({
            message: "New mixing data inserted",
            data: inserted.rows,
          });
        }
      }

      // === CASE: PEMAKAIAN BIASA ===
      const checkQuery = `
      SELECT usage_id FROM tb_r_oil_usage
      WHERE machine_id = $1
        AND oil_id = $2
        AND note_nm = $3
        AND CAST(created_dt AS DATE) = $4
    `;
      const checkResult = await client.query(checkQuery, [
        data.machine_id,
        data.oil_id,
        data.note_nm,
        todayDate,
      ]);

      if (checkResult.rowCount > 0) {
        // === UPDATE (hanya oil_volume & pic) ===
        const usageId = checkResult.rows[0].usage_id;
        const updateQuery = `
        UPDATE tb_r_oil_usage
        SET oil_volume = $1,
            pic = $2
        WHERE usage_id = $3
        RETURNING *;
      `;
        const updated = await client.query(updateQuery, [
          data.oil_volume,
          data.pic,
          usageId,
        ]);
        client.release();
        return res.status(201).json({
          message: "Data updated successfully",
          data: updated.rows,
        });
      } else {
        // === INSERT baru ===
        const lastUsageId = GET_LAST_ID("usage_id", "tb_r_oil_usage");
        const result = await client.query(lastUsageId);
        const newId = result.rows[0].new_id;

        const insertQuery = `
        INSERT INTO tb_r_oil_usage (
          usage_id, oil_id, oil_nm, type_nm,
          machine_id, machine_nm, oil_volume,
          pic, created_dt, note_id, note_nm, shift_type
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING *;
      `;
        const inserted = await client.query(insertQuery, [
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
          data.shift,
        ]);

        client.release();
        return res.status(201).json({
          message: "New data inserted",
          data: inserted.rows,
        });
      }
    } catch (error) {
      console.error("Error addPemakaianOli:", error);
      res.status(500).json({
        message: "Failed to insert/update data",
        error: error.message,
      });
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
