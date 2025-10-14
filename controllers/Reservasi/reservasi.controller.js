const database = require("../../config/storage");
const moment = require("moment-timezone");
const GET_LAST_ID = require("../../function/GET_LAST_ID");

module.exports = {
  addReservasi: async (req, res) => {
    try {
      const data = req.body;
      console.log("Request Data:", data);

      const dateOnly = moment(data.created_dt).format("YYYY-MM-DD");
      const client = await database.connect();

      // --- CEK RECORD SESUAI OIL_ID + TANGGAL + SHIFT ---
      const checkQuery = `
      SELECT *
      FROM tb_r_reservasi_chemical
      WHERE oil_id = $1
        AND DATE(created_dt) = $2
        AND shift = $3
    `;
      const checkResult = await client.query(checkQuery, [
        data.oil_id,
        dateOnly,
        data.shift,
      ]);

      if (checkResult.rows.length > 0) {
        // Record ada -> UPDATE
        const updateQuery = `
        UPDATE tb_r_reservasi_chemical
        SET
          vol = $1,
          updated_dt = $2,
          updated_by = $3
        WHERE oil_id = $4
          AND DATE(created_dt) = $5
          AND shift = $6
        RETURNING *
      `;
        const updatedResult = await client.query(updateQuery, [
          data.vol,
          new Date(),
          data.created_by,
          data.oil_id,
          dateOnly,
          data.shift,
        ]);

        client.release();
        return res.status(201).json({
          message: "Data updated",
          data: updatedResult.rows,
        });
      } else {
        // Record belum ada -> INSERT
        const queryLastId = GET_LAST_ID(
          "reservasi_id",
          "tb_r_reservasi_chemical"
        );
        const resultLastId = await client.query(queryLastId);
        const newId = resultLastId.rows[0].new_id;

        const insertQuery = `
        INSERT INTO tb_r_reservasi_chemical
          (reservasi_id, oil_id, oil_nm, material_no, shift, vol, created_dt, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
        const values = [
          newId,
          data.oil_id,
          data.oil_nm,
          data.material_no,
          data.shift,
          data.vol,
          data.created_dt,
          data.created_by,
        ];
        const insertedResult = await client.query(insertQuery, values);

        client.release();
        return res.status(201).json({
          message: "Data inserted",
          data: insertedResult.rows,
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Failed to Add Data",
        error: error.message,
      });
    }
  },

  getReservasi: async (req, res) => {
    try {
      // Tangkap month dari query string
      let month = req.query.month;
      let monthStr;

      if (typeof month === "string") {
        monthStr = month;
      } else if (month && typeof month.month === "string") {
        monthStr = month.month;
      } else {
        monthStr = null;
      }

      let startDt, endDt;

      if (monthStr) {
        // Buat tanggal awal bulan + jam 7 pagi
        const [y, m] = monthStr.split("-");
        startDt = moment.tz(
          `${y}-${m}-01 07:00:00`,
          "YYYY-MM-DD HH:mm:ss",
          "Asia/Jakarta"
        );
      } else {
        // Bulan sekarang
        startDt = moment()
          .tz("Asia/Jakarta")
          .startOf("month")
          .hour(7)
          .minute(0)
          .second(0);
      }

      // Tanggal 1 bulan berikutnya jam 7 pagi
      endDt = startDt.clone().add(1, "months");

      const client = await database.connect();

      const q = `
                SELECT *,
                  CASE
                  WHEN EXTRACT(HOUR FROM created_dt) < 7
                  THEN (created_dt - INTERVAL '1 day')::date
                  ELSE created_dt::date
                  END AS display_date
                  FROM tb_r_reservasi_chemical
                  WHERE created_dt >= $1
                  AND created_dt < $2
                  ORDER BY created_dt DESC
                `;

      const result = await client.query(q, [
        startDt.format("YYYY-MM-DD HH:mm:ss"),
        endDt.format("YYYY-MM-DD HH:mm:ss"),
      ]);

      const userData = result.rows;
      client.release();

      res.status(200).json({
        message: "Success to Get Data",
        data: userData,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to Get Data",
        error: error.message,
      });
    }
  },
  addReservasiNote: async (req, res) => {
    try {
      const { reservasi_id, note_id, note_nm } = req.body;

      // Validasi input
      if (!reservasi_id) {
        return res.status(400).json({
          message: "reservasi_id tidak boleh kosong",
        });
      }

      const client = await database.connect();

      // UPDATE note di table berdasarkan reservasi_id
      const updateQuery = `
      UPDATE tb_r_reservasi_chemical
      SET note_id = $1,
          note_nm = $2,
          updated_dt = NOW()
      WHERE reservasi_id = $3
      RETURNING *
    `;

      const result = await client.query(updateQuery, [
        note_id,
        note_nm,
        reservasi_id,
      ]);
      client.release();

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Data reservasi tidak ditemukan",
        });
      }

      return res.status(200).json({
        message: "Note berhasil disimpan",
        data: result.rows[0],
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Gagal menyimpan note",
        error: error.message,
      });
    }
  },
};
