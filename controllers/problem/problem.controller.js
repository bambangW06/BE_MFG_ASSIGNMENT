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
      // console.log("modalType", modalType);

      const time_range = req.query.time_range;
      // console.log("time_range", time_range);

      const selectedDate = req.query.selectedDate;
      // console.log("selectedDate", selectedDate);

      let start_date, end_date;

      // Jika selectedDate ada, gunakan itu
      if (selectedDate) {
        start_date = moment(selectedDate)
          .set({ hour: 7, minute: 0, second: 0, millisecond: 0 }) // Set ke jam 07:00 pada selectedDate
          .format("YYYY-MM-DD HH:mm:ss");

        end_date = moment(selectedDate)
          .add(1, "days") // Tambah satu hari untuk end_date
          .set({ hour: 7, minute: 0, second: 0, millisecond: 0 }) // Set ke jam 07:00 pada hari berikutnya
          .format("YYYY-MM-DD HH:mm:ss");
      } else {
        // Tanggal hari ini
        const today = moment();
        if (today.hour() < 7) {
          // Jika masih sebelum jam 07:00, ambil dari kemarin
          start_date = today
            .subtract(1, "days") // Mundur satu hari
            .set({ hour: 7, minute: 0, second: 0, millisecond: 0 }) // Set ke jam 07:00 kemarin
            .format("YYYY-MM-DD HH:mm:ss");

          end_date = today
            .set({ hour: 7, minute: 0, second: 0, millisecond: 0 }) // Set ke jam 07:00 hari ini
            .add(1, "days") // Tambah satu hari untuk end_date
            .format("YYYY-MM-DD HH:mm:ss"); // Set ke jam 07:00 pada hari berikutnya
        } else {
          // Ambil data hari ini
          start_date = today
            .set({ hour: 7, minute: 0, second: 0, millisecond: 0 }) // Set ke jam 07:00 hari ini
            .format("YYYY-MM-DD HH:mm:ss");

          end_date = today
            .add(1, "days") // Tambah satu hari untuk end_date
            .set({ hour: 7, minute: 0, second: 0, millisecond: 0 }) // Set ke jam 07:00 pada hari berikutnya
            .format("YYYY-MM-DD HH:mm:ss");
        }
      }

      if (modalType === "category") {
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
                 r_in_process.created_dt AT TIME ZONE 'Asia/Jakarta' >= $2 AND r_in_process.created_dt AT TIME ZONE 'Asia/Jakarta' < $3
            `;

        const values = [time_range, start_date, end_date];
        // console.log("Query:", q);
        // console.log("Values:", values); // Log values
        const client = await database.connect();
        const userDataQuery = await client.query(q, values);
        const userData = userDataQuery.rows;
        client.release();
        res.status(200).json({
          message: "Success to Get Data",
          data: userData,
        });
      } else if (modalType === "next proses") {
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
            r_next_process.created_dt AT TIME ZONE 'Asia/Jakarta' >= $2 AND r_next_process.created_dt AT TIME ZONE 'Asia/Jakarta' < $3
        `;

        const values = [time_range, start_date, end_date];
        // console.log("Query:", q);
        // console.log("Values:", values); // Log values
        const client = await database.connect();
        const userDataQuery = await client.query(q, values);
        const userData = userDataQuery.rows;
        client.release();
        res.status(200).json({
          message: "Success to Get Data",
          data: userData,
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({
        message: "Failed to Get Data",
        error: error.message,
      });
    }
  },

  deleteProblem: async (req, res) => {
    try {
      const modalType = req.query.modalType;
      const problem_id = req.query.problem_id;
      // console.log("modalType", modalType);
      // console.log("problem_id", problem_id);
      if (modalType === "category") {
        const q = `DELETE FROM tb_r_in_process WHERE problem_id = $1`;

        const values = [problem_id];
        const client = await database.connect();
        const userDataQuery = await client.query(q, values);
        const userData = userDataQuery.rows;
        client.release();
        res.status(200).json({
          message: "Success to Delete Data",
          data: userData,
        });
      } else if (modalType === "next proses") {
        const q = `DELETE FROM tb_r_next_process WHERE problem_id = $1`;

        const values = [problem_id];
        const client = await database.connect();
        const userDataQuery = await client.query(q, values);
        const userData = userDataQuery.rows;
        client.release();
        res.status(200).json({
          message: "Success to Delete Data",
          data: userData,
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({
        message: "Failed to Get Data",
        error: error.message,
      });
    }
  },
  problemTable: async (req, res) => {
    try {
      const selectedDate = req.query.selectedDate;
      // console.log("selectedDate", selectedDate);

      let start_date, end_date;

      // Jika selectedDate ada, gunakan itu
      if (selectedDate) {
        start_date = moment(selectedDate)
          .set({ hour: 7, minute: 0, second: 0, millisecond: 0 }) // Set ke jam 07:00 pada selectedDate
          .format("YYYY-MM-DD HH:mm:ss");

        end_date = moment(selectedDate)
          .add(1, "days") // Tambah satu hari untuk end_date
          .set({ hour: 7, minute: 0, second: 0, millisecond: 0 }) // Set ke jam 07:00 pada hari berikutnya
          .format("YYYY-MM-DD HH:mm:ss");
      } else {
        // Tanggal hari ini
        const today = moment();
        if (today.hour() < 7) {
          // Jika masih sebelum jam 07:00, ambil dari kemarin
          start_date = today
            .subtract(1, "days") // Mundur satu hari
            .set({ hour: 7, minute: 0, second: 0, millisecond: 0 }) // Set ke jam 07:00 kemarin
            .format("YYYY-MM-DD HH:mm:ss");

          end_date = today
            .set({ hour: 7, minute: 0, second: 0, millisecond: 0 }) // Set ke jam 07:00 hari ini
            .add(1, "days") // Tambah satu hari untuk end_date
            .format("YYYY-MM-DD HH:mm:ss"); // Set ke jam 07:00 pada hari berikutnya
        } else {
          // Ambil data hari ini
          start_date = today
            .set({ hour: 7, minute: 0, second: 0, millisecond: 0 }) // Set ke jam 07:00 hari ini
            .format("YYYY-MM-DD HH:mm:ss");

          end_date = today
            .add(1, "days") // Tambah satu hari untuk end_date
            .set({ hour: 7, minute: 0, second: 0, millisecond: 0 }) // Set ke jam 07:00 pada hari berikutnya
            .format("YYYY-MM-DD HH:mm:ss");
        }
      }

      // console.log("Start Date:", start_date);
      // console.log("End Date:", end_date);

      // Query untuk tb_r_in_process
      const queryInProcess = `SELECT 
                r_in_process.*, 
                m_category.category_nm
              FROM 
                tb_r_in_process r_in_process
              INNER JOIN 
                tb_m_category m_category 
              ON 
                r_in_process.category_id = m_category.category_id
              WHERE 
                r_in_process.created_dt BETWEEN $1 AND $2`;

      // Query untuk tb_r_next_proses
      const queryNextProses = `SELECT 
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
            r_next_process.created_dt BETWEEN $1 AND $2`;

      const values = [start_date, end_date];

      const client = await database.connect();

      // Jalankan kedua query secara paralel
      const [inProcessDataQuery, nextProsesDataQuery] = await Promise.all([
        client.query(queryInProcess, values),
        client.query(queryNextProses, values),
      ]);

      let inProcessData = inProcessDataQuery.rows;
      let nextProsesData = nextProsesDataQuery.rows;

      // Log hasil query
      // console.log("In Process Data:", inProcessData);
      // console.log("Next Process Data:", nextProsesData);

      // Format created_dt menjadi "YYYY-MM-DD"
      inProcessData = inProcessData.map((item) => {
        return {
          ...item,
          created_dt: moment(item.created_dt).format("YYYY-MM-DD"),
        };
      });

      nextProsesData = nextProsesData.map((item) => {
        return {
          ...item,
          created_dt: moment(item.created_dt).format("YYYY-MM-DD"),
        };
      });

      client.release();

      // Kirimkan data dari kedua tabel secara terpisah
      res.status(200).json({
        message: "Success to Get Data",
        data: {
          inProcess: inProcessData,
          nextProcess: nextProsesData,
        },
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({
        message: "Failed to Get Data",
        error: error.message,
      });
    }
  },
};
