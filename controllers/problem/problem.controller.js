var database = require("../../config/storage");
const moment = require("moment-timezone");
module.exports = {
  addProblem: async (req, res) => {
    try {
      const { category_id, time_range, problem_nm, waktu } = req.body;
      const q = `INSERT INTO tb_r_in_process (category_id, time_range, problem_nm, waktu) VALUES ($1, $2, $3, $4) RETURNING *`;
      const values = [category_id, time_range, problem_nm, waktu];
      const client = await database.connect();
      const userDataQuery = await client.query(q, values);
      const userData = userDataQuery.rows;
      client.release();
      res.status(201).json({
        message: "Success to Add Data",
        data: userData,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to Add Data",
        error: error,
      });
    }
  },
  addNextProcess: async (req, res) => {
    try {
      const {
        line_id,
        machine_id,
        tool_id,
        time_range,
        problem_nm,
        act_counter,
      } = req.body;
      const q = `INSERT INTO tb_r_next_process (line_id, machine_id, tool_id, time_range, problem_nm, act_counter) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
      const values = [
        line_id,
        machine_id,
        tool_id,
        time_range,
        problem_nm,
        act_counter,
      ];
      const client = await database.connect();
      const userDataQuery = await client.query(q, values);
      const userData = userDataQuery.rows;
      client.release();
      res.status(201).json({
        message: "Success to Add Data",
        data: userData,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to Add Data",
        error: error,
      });
    }
  },
  getProblem: async (req, res) => {
    try {
      const modalType = req.query.modalType;
      console.log("modalType", modalType);

      const time_range = req.query.time_range;

      console.log("time_range", time_range);

      // Tanggal hari ini pukul 07:00
      const start_date = moment()
        .startOf("day")
        .add(7, "hours")
        .format("YYYY-MM-DD HH:mm:ss");

      // Tanggal besok pukul 07:00
      const end_date = moment()
        .add(1, "day")
        .startOf("day")
        .add(7, "hours")
        .format("YYYY-MM-DD HH:mm:ss");

      if (modalType == "category") {
        const q = `
              SELECT 
                r_in_process.*, 
                m_category.category_nm
              FROM 
                tb_r_in_process r_in_process
              INNER JOIN 
                tb_m_category m_category 
              ON 
                r_in_process.category_id = m_category.category_id
              WHERE 
                r_in_process.time_range = $1
              AND 
                r_in_process.created_dt BETWEEN $2 AND $3
            `;

        const values = [time_range, start_date, end_date];
        console.log("Query:", q);
        console.log("Values:", values); // Log values
        const client = await database.connect();
        const userDataQuery = await client.query(q, values);
        const userData = userDataQuery.rows;
        client.release();
        res.status(200).json({
          message: "Success to Add Data",
          data: userData,
        });
      } else if (modalType == "next proses") {
        const q = `
          SELECT 
          r_next_process.*,
          m_line.line_nm,
          m_machine.machine_nm,
          m_tool.tool_nm,
          m_tool.std_counter
          FROM 
          tb_r_next_process r_next_process
          INNER JOIN 
          tb_m_lines m_line 
          ON 
          r_next_process.line_id = m_line.line_id
          INNER JOIN 
          tb_m_machines m_machine 
          ON 
          r_next_process.machine_id = m_machine.machine_id
          INNER JOIN 
          tb_m_master_tools m_tool 
          ON 
          r_next_process.tool_id = m_tool.tool_id
          WHERE 
          r_next_process.time_range = $1
          AND 
          r_next_process.created_dt BETWEEN $2 AND $3
        `;

        const values = [time_range, start_date, end_date];
        console.log("Query:", q);
        console.log("Values:", values); // Log values
        const client = await database.connect();
        const userDataQuery = await client.query(q, values);
        const userData = userDataQuery.rows;
        client.release();
        res.status(200).json({
          message: "Success to Add Data",
          data: userData,
        });
      }
    } catch (error) {
      res.status(500).json({
        message: "Failed to Add Data",
      });
    }
  },
};
