var database = require("../config/storage");
module.exports = {
  addKaryawan: async (req, res) => {
    try {
      // Ambil data dari body permintaan
      const { nama, noreg, shift, jabatan, default_position } = req.body;
      const profileFilename = req.file.filename; // Ambil nama file foto dari req.file
      // Buat URL lengkap untuk foto berdasarkan base URL
      const profileUrl = `/uploads/${profileFilename}`;

      // Buat query untuk menyimpan data ke dalam database
      let q = `INSERT INTO tb_m_employees (nama, noreg, profile, shift, jabatan, default_position)
                    VALUES ($1, $2, $3, $4, $5, $6) 
                    RETURNING *`;

      // Atur nilai-nilai untuk parameter query
      const values = [
        nama,
        noreg,
        profileUrl,
        shift,
        jabatan,
        default_position,
      ];

      // Koneksi ke database
      const client = await database.connect();

      // Eksekusi query dengan menggunakan nilai-nilai yang telah disiapkan
      const userDataQuery = await client.query(q, values);
      const userData = userDataQuery.rows;
      client.release();

      // console.log("UserData:", userData);
      res.status(201).json({
        message: "Success to Add Data",
        data: {
          ...userData[0], // Gunakan data pertama dari hasil query
          photourl: profileUrl, // Tambahkan URL lengkap ke gambar
        },
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to Add Data",
      });
    }
  },

  getKaryawan: async (req, res) => {
    try {
      const q = `SELECT *, profile AS photourl FROM tb_m_employees`;
      const client = await database.connect();
      const userDataQuery = await client.query(q);
      const userData = userDataQuery.rows;
      client.release();
      // console.log("Data karyawan yang dikirim ke frontend:", userData); // Logging untuk memeriksa data karyawan sebelum dikirim
      res.status(200).json({
        message: "Success to Get Data",
        data: userData,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to Get Data",
      });
    }
  },

  editKaryawan: async (req, res) => {
    try {
      const id = req.params.id; // Ambil ID langsung dari req.params

      // Ambil data karyawan dari database untuk mendapatkan nilai sebelumnya
      const employee = await database.query(
        "SELECT * FROM tb_m_employees WHERE employee_id = $1",
        [id]
      );
      const { nama, noreg, shift, jabatan, profile, default_position } =
        employee.rows[0];

      // Tentukan nilai akhir untuk setiap input
      const finalNama =
        req.body.nama !== undefined && req.body.nama.trim() !== ""
          ? req.body.nama
          : nama;
      const finalNoreg =
        req.body.noreg !== undefined && req.body.noreg.trim() !== ""
          ? req.body.noreg
          : noreg;
      const finalShift =
        req.body.shift !== undefined && req.body.shift.trim() !== ""
          ? req.body.shift
          : shift;
      const finalJabatan =
        req.body.jabatan !== undefined && req.body.jabatan.trim() !== ""
          ? req.body.jabatan
          : jabatan;
      const finalProfileUrl = req.file
        ? `/uploads/${req.file.filename}`
        : profile;
      const finalDefaultPosition =
        req.body.default_position !== undefined &&
        req.body.default_position.trim() !== ""
          ? req.body.default_position
          : default_position;

      console.log("Data yang diterima dari req.body:", req.body);

      // Buat kueri update dengan menggunakan sintaks yang benar untuk Postgres
      const updateQuery = `
                UPDATE tb_m_employees
                SET nama = $1, noreg = $2, profile = $3, shift = $4, jabatan = $5, default_position = $6
                WHERE employee_id = $7
            `;

      // Gunakan ID dari parameter untuk mengidentifikasi karyawan yang akan diperbarui
      const values = [
        finalNama,
        finalNoreg,
        finalProfileUrl,
        finalShift,
        finalJabatan,
        finalDefaultPosition,
        id,
      ];

      // Jalankan kueri ke database
      await database.query(updateQuery, values);

      // Kirim respons jika berhasil
      res.status(201).json({
        message: "Success to Edit Data",
      });
    } catch (error) {
      console.error("Gagal mengedit karyawan:", error);
      // Kirim respons jika terjadi kesalahan
      res.status(500).json({
        message: "Failed to Edit Data",
      });
    }
  },
  deleteKaryawan: async (req, res) => {
    let client;
    try {
      const id = req.params.id;

      // Mulai transaksi
       client = await database.connect();
      await client.query("BEGIN");

      // Hapus dulu data absensi yang terkait dengan karyawan
      const deleteAbsencesQuery = `DELETE FROM tb_m_absences WHERE employee_id = $1`;
      await client.query(deleteAbsencesQuery, [id]);
      const deletePopsitonQuery = `DELETE FROM tb_r_position WHERE employee_id = $1`;
      await client.query(deletePopsitonQuery, [id]);
      // Hapus data karyawan
      const deleteEmployeeQuery = `DELETE FROM tb_m_employees WHERE employee_id = $1`;
      await client.query(deleteEmployeeQuery, [id]);

      // Commit transaksi
      await client.query("COMMIT");
      client.release();

      res.status(200).json({
        message: "Berhasil menghapus data karyawan",
      });
    } catch (error) {
      // Rollback transaksi jika terjadi kesalahan
      await client.query("ROLLBACK");
      client.release();

      console.error("Gagal menghapus karyawan:", error);
      res.status(500).json({
        message: "Gagal menghapus data karyawan",
      });
    }
  },
};
