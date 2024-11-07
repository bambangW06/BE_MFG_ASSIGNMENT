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
        category_id,
        category_nm,
        waktu,
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

      const getNextId = async () => {
        let query;

        // Cek apakah problem_id dan category_id ada
        if (problem_id && category_id) {
          // Jika ada, pilih dari tb_r_analisa_inprocess
          query = `SELECT MAX(analisa_id) AS maxId FROM tb_r_analisa_inprocess;`;
        } else {
          // Jika tidak ada, pilih dari tb_r_analisa
          query = `SELECT MAX(analisa_id) AS maxId FROM tb_r_analisa;`;
        }

        const result = await client.query(query);
        const maxId = result.rows[0].maxid || 0; // Jika tabel kosong, mulai dari 0
        return maxId + 1; // Tambah 1 untuk ID berikutnya
      };
      // Mendapatkan ID berikutnya untuk analisa_id
      const nextAnalisaId = await getNextId();

      // Tentukan tabel dan kolom sesuai kondisi
      let query, values;
      if (category_id && category_nm && waktu) {
        // Jika "Problem In Proses"
        query = `
          INSERT INTO public.tb_r_analisa_inprocess (analisa_id, shift, problem_id, problem_nm, category_id, category_nm, waktu, created_dt, analisa, foto)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *;
        `;
        values = [
          nextAnalisaId,
          shift,
          problem_id,
          problem_nm,
          category_id,
          category_nm,
          waktu,
          created_dt,
          analisa,
          fileUrls.length > 0 ? JSON.stringify(fileUrls) : null,
        ];
      } else {
        // Jika "Problem Next Proses"
        query = `
          INSERT INTO public.tb_r_analisa (analisa_id, shift, problem_id, problem_nm, machine_id, tool_id, tool_nm, created_dt, analisa, foto)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *;
        `;
        values = [
          nextAnalisaId,
          shift,
          problem_id,
          problem_nm,
          machine_id,
          tool_id,
          tool_nm,
          created_dt,
          analisa,
          fileUrls.length > 0 ? JSON.stringify(fileUrls) : null,
        ];
      }

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
        tb_r_analisa.analisa_id,
        tb_r_analisa.shift,
        tb_r_analisa.problem_id,
        tb_r_analisa.problem_nm,
        tb_r_analisa.machine_id,
        tb_r_analisa.tool_id,
        tb_r_analisa.tool_nm,
        tb_r_analisa.created_dt,
        tb_r_analisa.analisa,
        tb_r_analisa.foto,
        tb_r_next_process.act_counter,
        tb_m_master_tools.std_counter, 
        tb_m_master_tools.process_nm,
        tb_m_master_tools.line_nm,
        tb_m_machines.machine_nm,
        NULL::integer AS category_id,  
        NULL::varchar AS category_nm, 
        NULL::integer AS waktu       
      FROM tb_r_analisa
      LEFT JOIN tb_r_next_process 
        ON tb_r_analisa.problem_id = tb_r_next_process.problem_id
      LEFT JOIN tb_m_master_tools 
        ON tb_r_analisa.tool_id = tb_m_master_tools.tool_id
      LEFT JOIN tb_m_machines 
        ON tb_r_analisa.machine_id = tb_m_machines.machine_id
      WHERE tb_r_analisa.shift = $1 
        AND tb_r_analisa.created_dt::date = $2
    
      UNION ALL
    
      SELECT 
        tb_r_analisa_inprocess.analisa_id,
        tb_r_analisa_inprocess.shift,
        tb_r_analisa_inprocess.problem_id,
        tb_r_analisa_inprocess.problem_nm,
        NULL::integer AS machine_id,
        NULL::integer AS tool_id,
        NULL::varchar AS tool_nm,
        tb_r_analisa_inprocess.created_dt,
        tb_r_analisa_inprocess.analisa,
        tb_r_analisa_inprocess.foto,
        NULL::integer AS act_counter,
        NULL::integer AS std_counter, 
        NULL::varchar AS process_nm,
        NULL::varchar AS line_nm,
        NULL::varchar AS machine_nm,
        tb_r_analisa_inprocess.category_id, 
        tb_r_analisa_inprocess.category_nm,  
        tb_r_analisa_inprocess.waktu       
      FROM tb_r_analisa_inprocess
      WHERE tb_r_analisa_inprocess.shift = $1 
        AND tb_r_analisa_inprocess.created_dt::date = $2
    
      ORDER BY created_dt DESC;
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
  editAnalisaProblem: async (req, res) => {
    try {
      const problem_id = req.params.id;
      const { problem_nm, analisa, category_id } = req.body; // Tambahkan category_id
      const updated_dt = moment()
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");

      // Log uploaded files
      let fileUrls = [];
      if (req.files && Array.isArray(req.files.foto)) {
        fileUrls = req.files.foto.map((file) => `/uploads/${file.filename}`);
      } else if (req.files && req.files.foto) {
        fileUrls = [`/uploads/${req.files.foto.filename}`];
      }

      const client = await database.connect();

      // Ambil data lama dari database
      const currentDataQuery = `
        SELECT problem_nm, analisa, foto FROM ${
          category_id ? "tb_r_analisa_inprocess" : "tb_r_analisa"
        } WHERE problem_id = $1 ${category_id ? "AND category_id = $2" : ""}
      `;
      const currentDataValues = category_id
        ? [problem_id, category_id]
        : [problem_id];
      const currentDataResult = await client.query(
        currentDataQuery,
        currentDataValues
      );
      const currentData = currentDataResult.rows[0];

      // Cek perubahan nilai
      const updates = [];
      const values = [];
      let valueIndex = 1;

      if (problem_nm && problem_nm !== currentData.problem_nm) {
        updates.push(`problem_nm = $${valueIndex++}`);
        values.push(problem_nm);
      }

      if (analisa && analisa !== currentData.analisa) {
        updates.push(`analisa = $${valueIndex++}`);
        values.push(analisa);
      }

      if (fileUrls.length > 0) {
        const newFoto = JSON.stringify(fileUrls);
        if (newFoto !== currentData.foto) {
          updates.push(`foto = $${valueIndex++}`);
          values.push(newFoto);
        }
      }

      // Jika ada perubahan, tambahkan updated_dt
      if (updates.length > 0) {
        updates.push(`updated_dt = $${valueIndex++}`);
        values.push(updated_dt);
      }

      // Jika tidak ada perubahan, kirim respons tanpa melakukan update
      if (updates.length === 0) {
        client.release();
        return res.status(200).json({
          message: "No changes detected, data remains the same.",
          data: currentData,
        });
      }

      // Buat query update jika ada perubahan
      const updateQuery = `
        UPDATE ${category_id ? "tb_r_analisa_inprocess" : "tb_r_analisa"}
        SET ${updates.join(", ")}
        WHERE problem_id = $${valueIndex} ${
        category_id ? `AND category_id = $${valueIndex + 1}` : ""
      }
        RETURNING *
      `;
      values.push(problem_id);
      if (category_id) values.push(category_id);

      const result = await client.query(updateQuery, values);
      client.release();

      res.status(200).json({
        message: "Success to Update Data",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).json({
        message: "Failed to Update Data",
        error: error.message,
      });
    }
  },

  deleteAnalisaProblem: async (req, res) => {
    try {
      const problem_id = req.params.id;
      const category_id = req.query.category_id; // Ambil category_id dari query parameter

      const client = await database.connect();

      let deleteQuery;
      let deleteValues;

      // Jika category_id ada, hapus dari tb_r_analisa_in_process, jika tidak ada hapus dari tb_r_analisa
      if (category_id) {
        deleteQuery = `
          DELETE FROM tb_r_analisa_inprocess
          WHERE problem_id = $1 AND category_id = $2
        `;
        deleteValues = [problem_id, category_id];
      } else {
        deleteQuery = `
          DELETE FROM tb_r_analisa
          WHERE problem_id = $1
        `;
        deleteValues = [problem_id];
      }

      const result = await client.query(deleteQuery, deleteValues);
      client.release();

      res.status(200).json({
        message: "Success to Delete Data",
        data: result.rows,
      });
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).json({
        message: "Failed to Delete Data",
        error: error.message,
      });
    }
  },
};
