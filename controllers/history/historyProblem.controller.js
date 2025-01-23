var database = require("../../config/storage");
const moment = require("moment-timezone");
module.exports = {
  getHistoryProblem: async (req, res) => {
    try {
      let {
        selectedMonth,
        selectedProblem,
        selectedLine,
        selectedMachine,
        selectedTool,
        category_id,
      } = req.query;
      // console.log("selectedMonth", selectedMonth);
      // console.log("selectedProblem", selectedProblem);
      // console.log("selectedLine", selectedLine);
      // console.log("selectedMachine", selectedMachine);
      // console.log("selectedTool", selectedTool);
      // console.log("selectedCategory", category_id);

      // Set default value for selectedMonth if not provided
      if (!selectedMonth) {
        selectedMonth = moment().tz("Asia/Jakarta").format("YYYY-MM");
      }

      let tableName;
      let query;
      let values = [selectedMonth];

      // Default condition for 'nextprocess'
      if (selectedProblem === "nextprocess") {
        tableName = "tb_r_next_process";
        query = `
          SELECT 
            ${tableName}.*, 
            lines.line_nm, 
            machines.machine_nm, 
            tools.tool_nm
          FROM ${tableName}
          LEFT JOIN tb_m_lines AS lines ON ${tableName}.line_id = lines.line_id
          LEFT JOIN tb_m_machines AS machines ON ${tableName}.machine_id = machines.machine_id
          LEFT JOIN tb_m_master_tools AS tools ON ${tableName}.tool_id = tools.tool_id
          WHERE to_char(${tableName}.created_dt, 'YYYY-MM') = $1
        `;

        // Add filters if selectedLine, selectedMachine, or selectedTool are provided
        if (selectedLine) {
          query += ` AND ${tableName}.line_id = $${values.length + 1}`;
          values.push(selectedLine);
        }
        if (selectedMachine) {
          query += ` AND ${tableName}.machine_id = $${values.length + 1}`;
          values.push(selectedMachine);
        }
        if (selectedTool) {
          query += ` AND ${tableName}.tool_id = $${values.length + 1}`;
          values.push(selectedTool);
        }
      } else {
        // For 'inprocess', no additional filtering based on Line, Machine, or Tool
        tableName = "tb_r_in_process";
        query = `
          SELECT 
            ${tableName}.*, 
            categories.category_nm
          FROM ${tableName}
          LEFT JOIN tb_m_category AS categories ON ${tableName}.category_id = categories.category_id
          WHERE to_char(${tableName}.created_dt, 'YYYY-MM') = $1
        `;
        if (category_id) {
          query += ` AND ${tableName}.category_id = $${values.length + 1}`;
          values.push(category_id);
        }
      }

      console.log("Generated Query:", query);

      // Execute the query with the dynamic values
      const client = await database.connect();
      const result = await client.query(query, values);
      let userData = result.rows;
      client.release();

      // Proses setiap item untuk mengubah tanggal berdasarkan waktu
      userData = userData.map((item) => {
        const createdDate = moment.tz(item.created_dt, "Asia/Jakarta");
        const hour = createdDate.hour();

        // Jika jam antara 00:00 dan 07:00, kurangi satu hari
        if (hour >= 0 && hour < 7) {
          createdDate.subtract(1, "day");
        }

        // Ganti `created_dt` dengan tanggal yang sudah diubah
        item.created_dt = createdDate.format("YYYY-MM-DD");
        return item;
      });

      // Kirimkan hasilnya sebagai respons
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
};
