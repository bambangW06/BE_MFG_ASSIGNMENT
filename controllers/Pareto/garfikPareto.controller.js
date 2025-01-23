var database = require("../../config/storage");
var moment = require("moment-timezone");

module.exports = {
  getParetoProblem: async (req, res) => {
    try {
      const { selectedMonth, selectedProblem } = req.query;

      // Validasi input
      if (!selectedMonth || !selectedProblem) {
        return res.status(400).json({
          message: "selectedMonth dan selectedProblem wajib diisi",
        });
      }

      // Tambahkan "-01" agar bisa digunakan sebagai timestamp
      const formattedMonth = `${selectedMonth}-01`;

      // Tentukan tabel, cara pengelompokan, dan join berdasarkan selectedProblem
      let tableName, groupByField, joinClause, includeOther;
      if (selectedProblem === "nextprocess") {
        tableName = "tb_r_next_process";
        groupByField = "tool_id";
        joinClause = `
          LEFT JOIN tb_m_machines AS machines 
            ON ${tableName}.machine_id = machines.machine_id
          LEFT JOIN tb_m_master_tools AS tools
            ON ${tableName}.tool_id = tools.tool_id
        `;
        includeOther = true; // Nextprocess tetap menangani 'Other'
      } else {
        tableName = "tb_r_in_process";
        groupByField = "category_id";
        joinClause = `
          LEFT JOIN tb_m_category AS categories
            ON ${tableName}.category_id = categories.category_id
        `;
        includeOther = false; // In-process tidak menangani 'Other'
      }

      // Query untuk mengambil data
      const query = `
           SELECT 
            ${tableName}.${groupByField} AS tool_id,
            ${selectedProblem === "nextprocess" ? "tools.tool_nm," : ""}
            ${selectedProblem === "nextprocess" ? "machines.machine_nm," : ""}
            ${tableName}.problem_nm,
            COUNT(*) AS jumlah,
            STRING_AGG(TO_CHAR(${tableName}.created_dt, 'YYYY-MM-DD'), ', ') AS tanggal_kejadian,
            CASE 
              WHEN ${tableName}.problem_nm = 'Other' THEN STRING_AGG(${tableName}.other_nm, ', ')
              ELSE NULL
            END AS other_detail
          FROM ${tableName}
          ${joinClause}
          WHERE DATE_TRUNC('month', ${tableName}.created_dt) = DATE_TRUNC('month', $1::timestamp)
          GROUP BY ${tableName}.${groupByField}, 
                  ${selectedProblem === "nextprocess" ? "tools.tool_nm," : ""}
                  ${
                    selectedProblem === "nextprocess"
                      ? "machines.machine_nm,"
                      : ""
                  }
                  ${tableName}.problem_nm
          ORDER BY jumlah DESC;

          `;

      console.log("query", query);

      const values = [formattedMonth];

      // Eksekusi query
      const result = await database.query(query, values);

      res.status(200).json({
        message: "Success to Get Data",
        data: result.rows,
      });
    } catch (error) {
      console.error("Error fetching pareto problem:", error);
      res.status(500).json({
        message: "Failed to Get Data",
        error: error.message,
      });
    }
  },
};
