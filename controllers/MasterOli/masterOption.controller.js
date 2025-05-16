var database = require("../../config/storage");
const moment = require("moment-timezone");
const GET_LAST_ID = require("../../function/GET_LAST_ID");

module.exports = {
  addMasterOption: async (req, res) => {
    try {
      const data = req.body;
      const ilustrationFile = req.file.filename;

      const ilustrationUrl = `/uploads/${ilustrationFile}`;

      const queryNewId = GET_LAST_ID("option_id", "tb_m_options");
      const client = await database.connect();
      const result = await client.query(queryNewId);
      const newId = result.rows[0].new_id;

      const insertQuery = `INSERT INTO tb_m_options 
                            (created_dt, created_by,  option_id, opt_nm, opt_desc, ilustration ) 
                            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
      const values = [
        data.created_dt,
        data.created_by,
        newId,
        data.opt_nm,
        data.opt_desc,
        ilustrationUrl,
      ];
      const resultInsert = await client.query(insertQuery, values);
      const dataInsert = resultInsert.rows;
      client.release();
      res.status(201).json({
        message: "Success to Add Data",
        data: dataInsert,
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        message: "Failed to Add Data",
        error: error.message,
      });
    }
  },
  editMasterOption: async (req, res) => {
    try {
      const option_id = req.params.option_id;

      const newData = req.body;

      const ilustrationFile = req.file?.filename;
      const ilustrationUrl = ilustrationFile
        ? `/uploads/${ilustrationFile}`
        : null;

      const client = await database.connect();

      // Ambil data lama
      const existing = await client.query(
        `SELECT * FROM tb_m_options WHERE option_id = $1`,
        [option_id]
      );

      if (existing.rows.length === 0) {
        client.release();
        return;
      }

      const oldData = existing.rows[0];

      // Ambil data yang akan di-update, jika tidak ada gunakan data lama
      const updatedData = {
        opt_nm: newData.opt_nm || oldData.opt_nm,
        opt_desc: newData.opt_desc || oldData.opt_desc,
        ilustration: ilustrationUrl || oldData.ilustration,
        changed_dt:
          newData.changed_dt || moment().format("YYYY-MM-DD HH:mm:ss"),
        changed_by: newData.changed_by || oldData.changed_by, // bisa tambahkan audit user
      };

      // Eksekusi update
      const updateQuery = `
      UPDATE tb_m_options 
        SET changed_dt = $1,
            changed_by = $2,
            opt_nm = $3,
            opt_desc = $4,
            ilustration = $5
        WHERE option_id = $6
        RETURNING *;
        `;

      const values = [
        updatedData.changed_dt,
        updatedData.changed_by,
        updatedData.opt_nm,
        updatedData.opt_desc,
        updatedData.ilustration,
        option_id,
      ];

      const result = await client.query(updateQuery, values);
      client.release();

      res.status(201).json({
        message: "Success to Edit Data",
        data: result.rows[0],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to Edit Data",
        error: error.message,
      });
    }
  },
  softDeletetMasterOption: async (req, res) => {
    try {
      const option_id = req.params.option_id;
      const client = await database.connect();
      const result = await client.query(
        `UPDATE tb_m_options SET deleted_at = $1 WHERE option_id = $2 RETURNING *`,
        [moment().format("YYYY-MM-DD HH:mm:ss"), option_id]
      );
      client.release();
      res.status(201).json({
        message: "Success to Delete Data",
        data: result.rows[0],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to Delete Data",
        error: error.message,
      });
    }
  },
};
