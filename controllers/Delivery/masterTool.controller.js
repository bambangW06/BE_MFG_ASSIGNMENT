var database = require("../../config/storage");
const moment = require("moment-timezone");

module.exports = {
  addMasterTool: async (req, res) => {
    try {
      const { tool_nm, line_id, op_no, tool_no, process_nm } = req.body;
      const profileFilename = req.file.filename; // Ambil nama file foto dari req.file
      // Buat URL lengkap untuk foto berdasarkan base URL
      const profileUrl = `/uploads/${profileFilename}`;

      // Query untuk mengambil line_nm dari tb_m_master_lines berdasarkan line_id
      const lineQuery = `SELECT line_nm FROM tb_m_master_lines WHERE line_id = $1`;
      const client = await database.connect();
      const lineResult = await client.query(lineQuery, [line_id]);
      const line_nm = lineResult.rows[0].line_nm; // Ambil line_nm dari hasil query

      // Query untuk memasukkan data ke tb_m_master_tools
      const insertQuery = `INSERT INTO tb_m_master_tools (line_id, line_nm, op_no, tool_no, process_nm, tool_nm, tool_img )
                           VALUES ($1, $2, $3, $4, $5, $6, $7)
                           RETURNING *`;

      const values = [
        line_id,
        line_nm,
        op_no,
        tool_no,
        process_nm,
        tool_nm,
        profileUrl,
      ];
      const userDataQuery = await client.query(insertQuery, values);
      const userData = userDataQuery.rows;

      client.release();

      res.status(201).json({
        message: "Success to Add Data",
        data: userData,
      });
    } catch (error) {
      console.error("Failed to Add Data:", error);
      res.status(500).json({
        message: "Failed to Add Data",
        error: error.message,
      });
    }
  },

  getMasterTool: async (req, res) => {
    try {
      const q = `SELECT * FROM tb_m_master_tools`;
      const client = await database.connect();
      const userDataQuery = await client.query(q);
      const userData = userDataQuery.rows;
      client.release();
      if (userData.length > 0) {
        userData.forEach((row) => {
          row.regis_dt = moment(row.regis_dt)
            .tz("Asia/Jakarta")
            .format("DD-MM-YYYY");
        });
      }
      res.status(200).json({
        message: "Success to Get Data",
        data: userData,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to Get Data",
      });
    }
  },
  editMasterTool: async (req, res) => {
    try {
      const id = req.params.id; // Ambil ID langsung dari req.params

      // Ambil data tool dari database untuk mendapatkan nilai sebelumnya
      const tool = await database.query(
        "SELECT * FROM tb_m_master_tools WHERE tool_id = $1",
        [id]
      );
      const {
        tool_nm,
        line_id: existingLineId,
        op_no,
        tool_no,
        process_nm,
        tool_img,
      } = tool.rows[0];

      // Tentukan nilai akhir untuk setiap input
      const finalToolNm =
        req.body.tool_nm !== undefined && req.body.tool_nm.trim() !== ""
          ? req.body.tool_nm
          : tool_nm;
      const finalLineId =
        req.body.line_id !== undefined && req.body.line_id.trim() !== ""
          ? req.body.line_id
          : existingLineId;
      const finalOpNo =
        req.body.op_no !== undefined && req.body.op_no.trim() !== ""
          ? req.body.op_no
          : op_no;
      const finalToolNo =
        req.body.tool_no !== undefined && req.body.tool_no.trim() !== ""
          ? req.body.tool_no
          : tool_no;
      const finalProcessNm =
        req.body.process_nm !== undefined && req.body.process_nm.trim() !== ""
          ? req.body.process_nm
          : process_nm;
      const finalProfileUrl = req.file
        ? `/uploads/${req.file.filename}`
        : tool_img;

      // Query untuk mengambil line_nm dari tb_m_master_lines berdasarkan line_id
      let line_nm;
      if (finalLineId !== existingLineId) {
        const lineQuery = `SELECT line_nm FROM tb_m_master_lines WHERE line_id = $1`;
        const lineResult = await database.query(lineQuery, [finalLineId]);
        line_nm = lineResult.rows[0].line_nm; // Ambil line_nm dari hasil query
      } else {
        line_nm = tool.rows[0].line_nm; // Gunakan line_nm yang ada
      }

      // Query untuk memperbarui data di tb_m_master_tools
      const updateQuery = `
        UPDATE tb_m_master_tools
        SET line_id = $1, line_nm = $2, op_no = $3, tool_no = $4, process_nm = $5, tool_nm = $6, tool_img = $7
        WHERE tool_id = $8
        RETURNING *
      `;

      const values = [
        finalLineId,
        line_nm,
        finalOpNo,
        finalToolNo,
        finalProcessNm,
        finalToolNm,
        finalProfileUrl,
        id,
      ];

      const userDataQuery = await database.query(updateQuery, values);
      const userData = userDataQuery.rows;

      res.status(200).json({
        message: "Success to Update Data",
        data: userData,
      });
    } catch (error) {
      console.error("Failed to Update Data:", error);
      res.status(500).json({
        message: "Failed to Update Data",
        error: error.message,
      });
    }
  },

  deleteMasterTool: async (req, res) => {
    try {
      const id = req.params.id;
      const deleteQuery = `DELETE FROM tb_m_master_tools WHERE tool_id = $1`;
      const values = [id];
      const userDataQuery = await database.query(deleteQuery, values);
      const userData = userDataQuery.rows;
      res.status(200).json({
        message: "Success to Delete Data",
        data: userData,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to Delete Data",
      });
    }
  },
};
