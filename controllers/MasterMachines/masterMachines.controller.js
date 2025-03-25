var database = require("../../config/storage");
const moment = require("moment-timezone");
const GET_LAST_ID = require("../../function/GET_LAST_ID");

module.exports = {
  getMasterMachines: async (req, res) => {
    try {
      let root_line_id = req.query.line_id;
      console.log("line_id:", root_line_id);

      // Validasi line_id, pastikan line_id bukan undefined atau string 'undefined'
      if (root_line_id === "undefined" || root_line_id === undefined) {
        root_line_id = null; // Atur line_id menjadi null jika tidak ada
      }

      let query = `
  SELECT 
    m.*, 
    l.line_nm 
  FROM 
    tb_m_machines m
  LEFT JOIN 
    tb_m_lines l 
  ON 
    m.root_line_id = l.line_id
`;

      const params = [];

      if (root_line_id !== null) {
        // Gunakan pengecekan lebih spesifik
        query += " WHERE m.root_line_id = $1";
        params.push(root_line_id);
      }

      query += " ORDER BY m.machine_id DESC"; // Pindahkan ORDER BY ke akhir

      const client = await database.connect(); // Ambil koneksi dari pool
      const result = await client.query(query, params); // Eksekusi query
      const machinesData = result.rows;

      client.release(); // Lepaskan koneksi setelah query selesai

      // Format tanggal jika ada kolom register_dt
      if (machinesData.length > 0) {
        machinesData.forEach((row) => {
          if (row.created_dt) {
            row.created_dt = moment(row.created_dt)
              .tz("Asia/Jakarta")
              .format("DD-MM-YYYY");
          }
        });
      }

      // Kirimkan data ke response
      res.status(200).json({
        message: "Success to Get Data",
        data: machinesData,
      });
    } catch (error) {
      console.error("Error in getMasterMachines:", error);
      res.status(500).json({
        message: "Server error",
      });
    }
  },
  addMasterMachine: async (req, res) => {
    try {
      const data = req.body;
      console.log("Request Data:", data);

      const queryLastId = GET_LAST_ID("machine_id", "tb_m_machines");
      const client = await database.connect();
      const result = await client.query(queryLastId);
      const lastId = result.rows[0].new_id;
      console.log("lastId", lastId);

      const insertQuery = `
        INSERT INTO tb_m_machines (line_id, idx_pos, machine_id, root_line_id,cell_nm, machine_nm, machine_desc, machine_maker,  created_dt, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
      `;
      const values = [
        data.line_id,
        data.idx_pos,
        lastId,
        data.root_line_id,
        data.cell_nm,
        data.machine_nm,
        data.machine_desc,
        data.machine_maker,
        moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss"),
        data.created_by,
      ];

      const { rows: userData } = await client.query(insertQuery, values);
      client.release();

      res.status(201).json({
        message: "Success to Add Data",
        data: userData,
      });
    } catch (error) {
      console.error("Error in addMasterMachine:", error);
      res.status(500).json({
        message: "Failed to Add Data",
      });
    }
  },
  editMasterMachine: async (req, res) => {
    try {
      const machine_id = req.params.machine_id;
      const data = req.body;
      console.log("Request Data:", data);

      // Filter data untuk mengabaikan null atau undefined
      const validFields = Object.keys(data).filter(
        (key) => data[key] !== null && data[key] !== undefined
      );

      // Jika tidak ada field yang valid, kirim error
      if (validFields.length === 0) {
        return res.status(400).json({ message: "No valid data to update" });
      }
      data.changed_dt = moment().format("YYYY-MM-DD HH:mm:ss");
      validFields.push("changed_dt"); // tambahkan register_dt secara manual

      console.log("validFields", validFields);

      /// Buat query UPDATE secara dinamis
      const setQuery = validFields
        .map((field, index) => `${field} = $${index + 1}`)
        .join(", ");
      const values = validFields.map((field) => data[field]);
      const query = `UPDATE tb_m_machines SET ${setQuery} WHERE machine_id = $${
        validFields.length + 1
      } RETURNING *`;

      // Jalankan query
      const client = await database.connect();
      const userDataQuery = await client.query(query, [...values, machine_id]);
      const userData = userDataQuery.rows;
      client.release();

      res.status(201).json({
        message: "Success to Update Data",
        data: userData,
      });
    } catch (error) {
      console.error("Error in editMasterMachine:", error);
      res.status(500).json({
        message: "Failed to Update Data",
      });
    }
  },
  deleteMasterMachine: async (req, res) => {
    try {
      const machine_id = req.params.machine_id;
      const client = await database.connect();

      const query = `DELETE FROM tb_m_machines WHERE machine_id = $1`;
      const userDataQuery = await client.query(query, [machine_id]);
      const userData = userDataQuery.rows;

      client.release();

      res.status(201).json({
        message: "Success to Delete Data",
        data: userData,
      });
    } catch (error) {
      console.error("Error in deleteMasterMachine:", error);
      res.status(500).json({
        message: "Failed to Delete Data",
      });
    }
  },
  getCellNm: async (req, res) => {
    try {
      const root_line_id = req.params.root_line_id;
      const query = `SELECT DISTINCT (cell_nm) cell_nm, line_id 
                     FROM tb_m_machines WHERE root_line_id = $1 
                     ORDER BY cell_nm ASC`;
      const client = await database.connect();
      const userDataQuery = await client.query(query, [root_line_id]);
      const userData = userDataQuery.rows;
      client.release();
      res.status(200).json({
        message: "Success to Get Data",
        data: userData,
      });
    } catch (error) {
      console.error("Error in getCellNm:", error);
      res.status(500).json({
        message: "Server error",
      });
    }
  },
  getLastIndex: async (req, res) => {
    try {
      const root_line_id = req.query.root_line_id;
      const line_id = req.query.line_id;
      const cell_nm = req.query.cell_nm;

      const query = ` SELECT COALESCE(MAX(idx_pos), 0) + 1 AS maxIdx
                      FROM tb_m_machines
                      WHERE root_line_id = $1 AND line_id = $2 AND cell_nm = $3;`;
      const client = await database.connect();
      const userDataQuery = await client.query(query, [
        root_line_id,
        line_id,
        cell_nm,
      ]);
      const userData = userDataQuery.rows;
      console.log("userData", userData);

      client.release();
      res.status(200).json({
        message: "Success to Get Data",
        data: userData,
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error",
      });
    }
  },
};
