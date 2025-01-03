var database = require("../../config/storage");
const moment = require("moment-timezone");
module.exports = {
  addProblem: async (req, res) => {
    try {
      const created_dt = moment()
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");

      const {
        category_id,
        time_range,
        problem_nm,
        waktu,
        mode,
        problem_id, // Digunakan saat mode 'edit'
      } = req.body;

      let query, values;

      if (mode === "edit") {
        // Mode edit: perbarui data berdasarkan problem_id
        let setClause = [];
        values = [];

        if (category_id !== undefined) {
          setClause.push(`category_id = $${values.length + 1}`);
          values.push(category_id);
        }
        if (time_range !== undefined) {
          setClause.push(`time_range = $${values.length + 1}`);
          values.push(time_range);
        }
        if (problem_nm !== undefined) {
          setClause.push(`problem_nm = $${values.length + 1}`);
          values.push(problem_nm);
        }
        if (waktu !== undefined) {
          setClause.push(`waktu = $${values.length + 1}`);
          values.push(waktu);
        }

        // Tambahkan `problem_id` untuk kondisi WHERE
        values.push(problem_id);

        // Buat query UPDATE dengan bagian SET dinamis
        query = `UPDATE tb_r_in_process SET ${setClause.join(
          ", "
        )} WHERE problem_id = $${values.length} RETURNING *`;
      } else {
        // Mode add: tambahkan data baru
        query = `INSERT INTO tb_r_in_process (category_id, time_range, problem_nm, waktu, created_dt) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`;
        values = [category_id, time_range, problem_nm, waktu, created_dt];
      }

      const client = await database.connect();
      const result = await client.query(query, values);
      const userData = result.rows;
      client.release();

      const message =
        mode === "edit" ? "Success to Update Data" : "Success to Add Data";

      res.status(201).json({
        message: message,
        data: userData,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to Add/Update Data",
        error: error.message,
      });
    }
  },

  addNextProcess: async (req, res) => {
    try {
      const created_dt = moment()
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");

      const {
        line_id,
        machine_id,
        tool_id,
        time_range,
        problem_nm,
        other_nm,
        act_counter,
        mode,
        problem_id,
      } = req.body;

      let query, values;

      if (mode === "edit") {
        // Inisialisasi array untuk bagian `SET` dan `values`
        let setClause = [];
        values = [];

        // Cek setiap field apakah memiliki nilai; jika iya, tambahkan ke query
        if (line_id !== undefined) {
          setClause.push(`line_id = $${values.length + 1}`);
          values.push(line_id);
        }
        if (machine_id !== undefined) {
          setClause.push(`machine_id = $${values.length + 1}`);
          values.push(machine_id);
        }
        if (tool_id !== undefined) {
          setClause.push(`tool_id = $${values.length + 1}`);
          values.push(tool_id);
        }
        if (time_range !== undefined) {
          setClause.push(`time_range = $${values.length + 1}`);
          values.push(time_range);
        }
        if (problem_nm !== undefined) {
          setClause.push(`problem_nm = $${values.length + 1}`);
          values.push(problem_nm);
        }
        if (act_counter !== undefined) {
          setClause.push(`act_counter = $${values.length + 1}`);
          values.push(act_counter);
        }

        setClause.push(`other_nm = $${values.length + 1}`);
        values.push(other_nm ?? null); // Jika undefined/null, set ke NULL

        // Menambahkan `problem_id` untuk kondisi `WHERE`
        values.push(problem_id);

        // Membuat query UPDATE dengan bagian `SET` dinamis
        query = `UPDATE tb_r_next_process SET ${setClause.join(
          ", "
        )} WHERE problem_id = $${values.length} RETURNING *`;
      } else {
        // Query untuk mode 'add' atau INSERT
        query = `INSERT INTO tb_r_next_process (line_id, machine_id, tool_id, time_range, problem_nm, act_counter, created_dt, other_nm) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
        values = [
          line_id,
          machine_id,
          tool_id,
          time_range,
          problem_nm,
          act_counter,
          created_dt,
          other_nm,
        ];
      }

      const client = await database.connect();
      const result = await client.query(query, values);
      const userData = result.rows;
      client.release();

      const message =
        mode === "edit" ? "Success to Update Data" : "Success to Add Data";

      res.status(201).json({
        message: message,
        data: userData,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to Add/Update Data",
        error: error.message,
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
      const client = await database.connect();

      await client.query("BEGIN"); // Memulai transaksi

      if (modalType === "category") {
        // Hapus data terkait di `tb_r_analisa` terlebih dahulu
        await client.query(`DELETE FROM tb_r_analisa WHERE problem_id = $1`, [
          problem_id,
        ]);

        // Kemudian hapus data di `tb_r_in_process`
        const q = `DELETE FROM tb_r_in_process WHERE problem_id = $1`;
        const userDataQuery = await client.query(q, [problem_id]);
        const userData = userDataQuery.rows;

        await client.query("COMMIT"); // Commit transaksi

        res.status(200).json({
          message: "Success to Delete Data",
          data: userData,
        });
      } else if (modalType === "next proses") {
        // Hapus data terkait di `tb_r_analisa` terlebih dahulu
        await client.query(`DELETE FROM tb_r_analisa WHERE problem_id = $1`, [
          problem_id,
        ]);

        // Kemudian hapus data di `tb_r_next_process`
        const q = `DELETE FROM tb_r_next_process WHERE problem_id = $1`;
        const userDataQuery = await client.query(q, [problem_id]);
        const userData = userDataQuery.rows;

        await client.query("COMMIT"); // Commit transaksi

        res.status(200).json({
          message: "Success to Delete Data",
          data: userData,
        });
      }

      client.release();
    } catch (error) {
      console.error("Error fetching data:", error);
      await client.query("ROLLBACK"); // Rollback transaksi jika terjadi error
      res.status(500).json({
        message: "Failed to Delete Data",
        error: error.message,
      });
    }
  },

  problemTable: async (req, res) => {
    try {
      const selectedDate = req.query.selectedDate;
      let start_date, end_date;

      // Jika selectedDate ada, gunakan itu
      if (selectedDate) {
        start_date = moment(selectedDate)
          .set({ hour: 7, minute: 0, second: 0, millisecond: 0 })
          .format("YYYY-MM-DD HH:mm:ss");

        end_date = moment(selectedDate)
          .add(1, "days")
          .set({ hour: 7, minute: 0, second: 0, millisecond: 0 })
          .format("YYYY-MM-DD HH:mm:ss");
      } else {
        const today = moment();
        if (today.hour() < 7) {
          start_date = today
            .subtract(1, "days")
            .set({ hour: 7, minute: 0, second: 0, millisecond: 0 })
            .format("YYYY-MM-DD HH:mm:ss");

          end_date = today
            .set({ hour: 7, minute: 0, second: 0, millisecond: 0 })
            .add(1, "days")
            .format("YYYY-MM-DD HH:mm:ss");
        } else {
          start_date = today
            .set({ hour: 7, minute: 0, second: 0, millisecond: 0 })
            .format("YYYY-MM-DD HH:mm:ss");

          end_date = today
            .add(1, "days")
            .set({ hour: 7, minute: 0, second: 0, millisecond: 0 })
            .format("YYYY-MM-DD HH:mm:ss");
        }
      }

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

      // Fungsi untuk memeriksa shift malam dan mengubah tanggal jika perlu
      const adjustNightShiftDate = (created_dt) => {
        const date = moment(created_dt);
        const hour = date.hour();

        // Jika berada antara pukul 00:00 sampai 06:59, ubah tanggal ke hari sebelumnya
        if (hour < 7) {
          return date.subtract(1, "day").format("YYYY-MM-DD");
        }

        // Selain itu, pertahankan tanggal
        return date.format("YYYY-MM-DD");
      };

      // Sesuaikan tanggal untuk shift malam
      inProcessData = inProcessData.map((item) => {
        return {
          ...item,
          created_dt: adjustNightShiftDate(item.created_dt),
        };
      });

      nextProsesData = nextProsesData.map((item) => {
        return {
          ...item,
          created_dt: adjustNightShiftDate(item.created_dt),
        };
      });

      client.release();

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
