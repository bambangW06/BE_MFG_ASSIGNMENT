var database = require("../config/storage");
module.exports = {
  addKaryawan: async (req, res) => {
    try {
      // Ambil data dari body permintaan
      const { nama, noreg, shift, jabatan } = req.body;
      const profileFilename = req.file.filename; // Ambil nama file foto dari req.file
      // Buat URL lengkap untuk foto berdasarkan base URL
      const profileUrl = `/uploads/${profileFilename}`;

      // Buat query untuk menyimpan data ke dalam database
      let q = `INSERT INTO tb_m_employees (nama, noreg, profile, shift, jabatan)
                    VALUES ($1, $2, $3, $4, $5) 
                    RETURNING *`;

      // Atur nilai-nilai untuk parameter query
      const values = [nama, noreg, profileUrl, shift, jabatan];

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
      const { nama, noreg, shift, jabatan, profile } = employee.rows[0];

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
      // console.log(finalProfileUrl);

      // console.log("Data yang diterima dari req.body:", req.body); // Log data yang diterima dari body

      // Buat kueri update dengan menggunakan sintaks yang benar untuk Postgres
      const updateQuery = `
                UPDATE tb_m_employees
                SET nama = $1, noreg = $2, profile = $3, shift = $4, jabatan = $5
                WHERE employee_id = $6
            `;

      // Gunakan ID dari parameter untuk mengidentifikasi karyawan yang akan diperbarui
      const values = [
        finalNama,
        finalNoreg,
        finalProfileUrl,
        finalShift,
        finalJabatan,
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
    try {
      const id = req.params.id;
      const q = `DELETE FROM tb_m_employees WHERE employee_id = $1`;
      const client = await database.connect();
      const userDataQuery = await client.query(q, [id]);
      const userData = userDataQuery.rows;
      client.release();
      res.status(201).json({
        message: "Success to Delete Data",
        data: userData,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to Delete Data",
      });
    }
  },
  searchKaryawan: async (req, res) => {
    try {
      let whereCond = ``;
      const searchInput = req.query.searchInput; // Menerima input pencarian dari frontend
      // Jika ada input pencarian, bangun kondisi pencarian berdasarkan input tersebut
      if (searchInput) {
        // Menggunakan LIKE untuk mencocokkan sebagian dari nilai pada beberapa kolom
        whereCond = `WHERE tb_m_employees.nama LIKE '%${searchInput}%'`;
      }
      // Bangun kueri SQL dengan kondisi pencarian dinamis
      let q = `SELECT *, profile AS photoUrl FROM tb_m_employees ${whereCond}`;
      // console.log(q);

      const client = await database.connect();
      let usersQuery = await client.query(q);
      let usersData = usersQuery.rows;
      client.release();
      if (usersData.length === 0) {
        // Jika tidak ada karyawan yang ditemukan, kirim respon khusus
        res.status(404).json({
          message: "Karyawan tidak ditemukan",
        });
      } else {
        // Jika ada karyawan yang ditemukan, kirim data karyawan
        res.status(201).json({
          message: "Success Search Data",
          data: usersData,
        });
      }
    } catch (error) {
      res.status(500).json({
        message: "Failed to Get Users Data",
      });
    }
  },
};
