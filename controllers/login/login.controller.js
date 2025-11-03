const database = require("../../config/storage");
const { comparePassword } = require("../../function/security");
const { encryptPassword } = require("../../function/security");
const GET_LAST_ID = require("../../function/GET_LAST_ID");

module.exports = {
  login: async (req, res) => {
    const client = await database.connect();
    try {
      const { username, password } = req.body;

      const query = `SELECT * FROM tb_users_tcm WHERE username = $1`;
      const result = await client.query(query, [username]);
      const user = result.rows[0];

      client.release();

      if (!user) {
        return res.status(401).json({ message: "User tidak ditemukan." });
      }

      const match = await comparePassword(password, user.password);
      if (!match) {
        return res.status(401).json({ message: "Password salah." });
      }

      // Kita kirim user ke FE, tapi tanpa session
      res.status(200).json({
        message: "Login berhasil.",
        user: { username: user.username, role: user.role },
      });
    } catch (error) {
      console.error("Error login:", error);
      client.release();
      res.status(500).json({ message: "Terjadi kesalahan server." });
    }
  },

  logout: (req, res) => {
    // FE yang clear sessionStorage / Vuex
    res.status(200).json({ message: "Logout berhasil." });
  },

  checkSession: async (req, res) => {
    // Opsional, kalau mau FE ngecek login via API
    res.status(200).json({ message: "Session OK" });
  },
  register: async (req, res) => {
    const client = await database.connect();
    try {
      const { username, password, role } = req.body;
      // 1️⃣ Dapatkan ID terakhir
      const lastIdQuery = GET_LAST_ID("user_id", "tb_users_tcm");
      const result = await client.query(lastIdQuery); // Menjalankan query untuk mendapatkan hasil
      const newId = result.rows[0].new_id; // Mengakses hasil query dengan alias 'new_id'
      console.log("newId", newId);

      // cek username sudah ada?
      const checkQuery = `SELECT * FROM tb_users_tcm WHERE username=$1`;
      const checkResult = await client.query(checkQuery, [username]);
      if (checkResult.rows.length > 0) {
        client.release();
        return res.status(400).json({ message: "Username sudah ada." });
      }

      // hash password
      const hashedPassword = await encryptPassword(password);

      // insert user
      const insertQuery = `
        INSERT INTO tb_users_tcm (user_id,username, password, role)
        VALUES ($1, $2, $3, $4)
        RETURNING user_id, username, role
      `;
      const insertResult = await client.query(insertQuery, [
        newId,
        username,
        hashedPassword,
        role || "user",
      ]);

      client.release();

      res.status(201).json({
        message: "User berhasil dibuat.",
        user: insertResult.rows[0],
      });
    } catch (err) {
      console.error("Error register:", err);
      client.release();
      res.status(500).json({ message: "Terjadi kesalahan server." });
    }
  },
};
