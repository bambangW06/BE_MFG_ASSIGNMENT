var database = require("../../config/storage");

module.exports = {
  getKanban: async (req, res) => {
    try {
      const q = `
            SELECT tool_id, line_id, line_nm, op_no, tool_no, process_nm, tool_nm, tool_img
            FROM tb_m_master_tools
          `;
      const client = await database.connect();
      const userDataQuery = await client.query(q);
      const userData = userDataQuery.rows;
      client.release();

      // Mengelompokkan alat berdasarkan line_nm
      const groupedData = userData.reduce((acc, tool) => {
        const lineName = tool.line_nm;
        if (!acc[lineName]) {
          acc[lineName] = [];
        }
        acc[lineName].push(tool);
        return acc;
      }, {});

      // Mengurutkan alat di setiap line_nm berdasarkan abjad
      Object.keys(groupedData).forEach((lineName) => {
        groupedData[lineName].sort((a, b) =>
          a.tool_nm.localeCompare(b.tool_nm)
        );
      });

      res.status(200).json({
        message: "Success to Get Data",
        data: groupedData,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to Get Data",
        error: error.message,
      });
    }
  },
  addRequestTool: async (req, res) => {
    const { tools } = req.body;

    if (!tools || !Array.isArray(tools) || tools.length === 0) {
      return res.status(400).json({
        message: "Invalid input: tools array is required",
      });
    }

    const client = await database.connect();

    try {
      // Mulai transaksi
      await client.query("BEGIN");

      // Menyimpan data ke tabel tool_requests
      const insertRequestQuery = `
        INSERT INTO tool_requests (request_date)
        VALUES (CURRENT_TIMESTAMP)
        RETURNING request_id
      `;
      const result = await client.query(insertRequestQuery);
      const requestId = result.rows[0].request_id;

      // Menyimpan data ke tabel tool_request_details
      const insertDetailsQuery = `
        INSERT INTO tool_request_details (request_id, tool_id, line_id, line_nm, tool_no, tool_nm, op_no, quantity, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;

      for (const tool of tools) {
        const {
          tool_id,
          line_id,
          line_nm,
          tool_no,
          tool_nm,
          op_no,
          quantity,
          notes,
        } = tool;
        await client.query(insertDetailsQuery, [
          requestId,
          tool_id,
          line_id,
          line_nm,
          tool_no,
          tool_nm,
          op_no,
          quantity,
          notes,
        ]);
      }

      // Commit transaksi
      await client.query("COMMIT");
      client.release();

      res.status(200).json({
        message: "Request tools successfully added",
        request_id: requestId,
      });
    } catch (error) {
      // Rollback transaksi jika terjadi kesalahan
      await client.query("ROLLBACK");
      client.release();
      res.status(500).json({
        message: "Failed to add request tools",
        error: error.message,
      });
    }
  },
};
