var database = require("../../config/storage");
var moment = require("moment-timezone");

module.exports = {
  addReservasi: async (req, res) => {
    try {
      const {
        drill,
        reamer,
        tap,
        insert,
        endmill,
        brush,
        reservasiDate,
        shift,
      } = req.body;

      // console.log(req.body);

      // console.log(
      //   drill,
      //   reamer,
      //   tap,
      //   insert,
      //   endmill,
      //   brush,
      //   reservasiDate,
      //   shift
      // );

      // Object to hold field names and values
      const fields = {
        drill: drill || null,
        reamer: reamer || null,
        tap: tap || null,
        insert: insert || null,
        endmill: endmill || null,
        brush: brush || null,
        reservasi_dt: reservasiDate,
        shift: shift,
      };

      // Filter out null or empty string values
      const filteredFields = Object.entries(fields).filter(
        ([key, value]) => value !== null && value !== ""
      );

      // Extract field names and values
      const fieldNames = filteredFields.map(([key]) => key);
      const values = filteredFields.map(([, value]) => value);

      // Construct the VALUES part of the query
      const valuePlaceholders = values
        .map((_, index) => `$${index + 1}`)
        .join(", ");

      // Base query for INSERT
      let q = `
              INSERT INTO tb_m_reservasi (${fieldNames.join(", ")})
              VALUES (${valuePlaceholders})
              ON CONFLICT (reservasi_dt, shift) 
              DO UPDATE SET `;

      // Array to store the update clauses
      const updateClauses = fieldNames
        .filter((field) => field !== "reservasi_dt" && field !== "shift") // Exclude reservasi_dt and shift from the update clauses
        .map((field) => `${field} = EXCLUDED.${field}`);

      // Join update clauses with commas
      q += updateClauses.join(", ");

      q += " RETURNING *;";

      const client = await database.connect();
      const userDataQuery = await client.query(q, values);
      const userData = userDataQuery.rows;
      client.release();

      res.status(201).json({
        message: "Success to Add Reservasi",
        data: userData,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to Add Reservasi",
      });
    }
  },

  getReservasi: async (req, res) => {
    try {
      const shift = req.query.shift; // Ambil shift dari query parameter
      // console.log("shift", shift);

      const today = moment().tz("Asia/Jakarta").format("YYYY-MM-DD");
      // console.log("today", today);
      const q = `SELECT * FROM tb_m_reservasi WHERE reservasi_dt = $1 AND shift = $2;`;
      const client = await database.connect();
      const userDataQuery = await client.query(q, [today, shift]);
      const userData = userDataQuery.rows;
      client.release();
      if (userData.length > 0) {
        // Konversi tanggal ke zona waktu 'Asia/Jakarta' menggunakan moment-timezone
        userData.forEach((row) => {
          row.reservasi_dt = moment(row.reservasi_dt)
            .tz("Asia/Jakarta")
            .format("YYYY-MM-DD");
        });
      }

      // console.log("reservasi", userData);
      res.status(200).json({
        message: "Success to Get Reservasi",
        data: userData,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to Get Reservasi",
      });
    }
  },
};
