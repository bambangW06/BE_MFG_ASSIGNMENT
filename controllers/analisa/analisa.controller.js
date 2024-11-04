const database = require("../../config/storage");
const moment = require("moment-timezone");

module.exports = {
  addAnalisa: async (req, res) => {
    const client = await database.connect();
    try {
      const {
        shift,
        machine_id,
        problem_id,
        problem_nm,
        tool_id,
        tool_nm,
        created_dt,
        analisa,
      } = req.body;

      // Log the uploaded files to see how many and what files are received
      console.log("Uploaded files:", req.files);
      const fileCount = req.files
        ? Array.isArray(req.files.foto)
          ? req.files.foto.length
          : 1
        : 0;
      console.log(`Number of files uploaded: ${fileCount}`);

      // Periksa apakah req.files ada dan foto adalah array atau objek
      let fileUrls = [];
      if (req.files && Array.isArray(req.files.foto)) {
        fileUrls = req.files.foto.map((file) => `/uploads/${file.filename}`);
      } else if (req.files && req.files.foto) {
        fileUrls = [`/uploads/${req.files.foto.filename}`]; // Untuk kasus file tunggal
      }

      console.log("File URLs:", fileUrls);

      // Fungsi untuk mendapatkan ID terakhir dan menambah 1
      const getNextId = async () => {
        const query = `SELECT MAX(analisa_id) AS maxId FROM tb_r_analisa;`;
        const result = await client.query(query);
        const maxId = result.rows[0].maxid || 0; // Jika tabel kosong, mulai dari 0
        return maxId + 1; // Tambah 1 untuk ID berikutnya
      };

      // Mendapatkan ID berikutnya untuk analisa_id
      const nextAnalisaId = await getNextId();

      // Buat query untuk menyimpan data ke dalam database
      const query = `
                INSERT INTO public.tb_r_analisa (analisa_id, shift, problem_id, problem_nm, machine_id, tool_id, tool_nm, created_dt, analisa, foto)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *;
              `;

      const values = [
        nextAnalisaId, // ID analisa baru
        shift,
        problem_id,
        problem_nm,
        machine_id,
        tool_id,
        tool_nm,
        created_dt, // Pastikan untuk mengonversi ke format timestamp
        analisa,
        fileUrls.length > 0 ? JSON.stringify(fileUrls) : null, // Simpan sebagai JSON jika ada
      ];

      // Eksekusi query untuk menyimpan data
      const result = await client.query(query, values);

      res.status(201).json({
        message: "Analisa added successfully",
        data: result.rows[0], // Kembalikan data analisa yang baru ditambahkan
      });
    } catch (error) {
      console.error("Error adding analisa:", error);
      res.status(500).json({ message: "Error adding analisa" });
    } finally {
      client.release(); // Pastikan koneksi selalu dilepaskan
    }
  },

  getAnalisa: async (req, res) => {
    try {
      const { shift, date } = req.query;
      console.log("req.query:", req.query); // Log parameter query

      // Mendapatkan waktu saat ini
      const now = moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");
      console.log("Current DateTime (now):", now); // Log waktu saat ini

      let searchDate;

      if (date) {
        // Jika parameter date ada, gunakan nilai tersebut
        searchDate = moment(date).startOf("day").format("YYYY-MM-DD");
      } else {
        // Jika tidak ada parameter date, tentukan tanggal berdasarkan waktu saat ini
        const currentHour = moment(now).hour();
        console.log("Current Hour:", currentHour); // Log jam saat ini

        if (currentHour < 7) {
          // Jika sekarang antara jam 00:00 sampai jam 07:00, gunakan tanggal kemarin
          searchDate = moment(now)
            .subtract(1, "days")
            .startOf("day")
            .format("YYYY-MM-DD");
        } else {
          // Jika sekarang setelah jam 07:00, gunakan tanggal hari ini
          searchDate = moment(now).startOf("day").format("YYYY-MM-DD");
        }
      }
      console.log("searchDate:", searchDate); // Log tanggal pencarian

      const query = `
        SELECT 
          tb_r_analisa.*, 
          tb_r_next_process.act_counter,
          tb_m_master_tools.std_counter, 
          tb_m_master_tools.process_nm,
          tb_m_master_tools.line_nm,
          tb_m_machines.machine_nm
        FROM tb_r_analisa
        LEFT JOIN tb_r_next_process 
          ON tb_r_analisa.problem_id = tb_r_next_process.problem_id
        LEFT JOIN tb_m_master_tools 
          ON tb_r_analisa.tool_id = tb_m_master_tools.tool_id
        LEFT JOIN tb_m_machines 
          ON tb_r_analisa.machine_id = tb_m_machines.machine_id
        WHERE tb_r_analisa.shift = $1 
          AND tb_r_analisa.created_dt::date = $2
      `;

      const values = [shift, searchDate]; // Ambil hanya bagian tanggal
      console.log("Query Values:", values); // Log parameter query

      const client = await database.connect();
      const result = await client.query(query, values);
      const userData = result.rows;
      client.release();

      if (userData.length === 0) {
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
        created_dt = formattedDate;
      }

      res.status(200).json({
        message: "Success to Get Data",
        data: userData,
      });
    } catch (error) {
      console.error("Error:", error.message); // Mencetak pesan kesalahan
      res.status(500).json({
        message: "Failed to Get Data",
        error: error.message, // Mengirim pesan kesalahan ke frontend
      });
    }
  },
};

// CREATE TABLE tb_r_analisa (
//   analisa_id int primary key not null,
//   shift varchar(10),
//   problem_id INT,
//   CONSTRAINT fk_problem_id FOREIGN KEY (problem_id)
//    REFERENCES tb_r_next_process(problem_id),
//   problem_nm VARCHAR(255) NOT NULL,
//   machine_id int,
//   constraint fk_machine_id foreign key (machine_id)
//   references tb_m_machines(machine_id),
//   tool_id INT,
//   CONSTRAINT fk_tool_id FOREIGN KEY (tool_id)
//   REFERENCES tb_m_master_tools(tool_id),
//   tool_nm VARCHAR(255) NOT NULL,
//   created_dt date,
//   analisa TEXT NOT NULL,
//   foto JSONB
// );
