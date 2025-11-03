require("dotenv").config(); // supaya process.env.DB_PASS terbaca
const database = require("../config/storage");
const { encryptPassword } = require("../function/security");
const GET_LAST_ID = require("../function/GET_LAST_ID");

async function createAdmin() {
  const client = await database.connect(); // pakai client
  try {
    // 1️⃣ Dapatkan ID terakhir
    const lastIdQuery = GET_LAST_ID("user_id", "tb_users_tcm");
    const lastIdResult = await client.query(lastIdQuery);
    const lastId = lastIdResult.rows[0]?.last_id || 0;
    const newId = lastId + 1;

    // 2️⃣ Hash password admin
    const passwordHash = await encryptPassword("sakuragiHanamichi123!");

    // 3️⃣ Insert admin baru
    const insertQuery = `
      INSERT INTO tb_users_tcm (user_id, username, password, role)
      VALUES ($1, $2, $3, $4)
    `;
    await client.query(insertQuery, [
      newId,
      "Bambang W",
      passwordHash,
      "admin",
    ]);

    console.log("Admin awal berhasil dibuat! user_id:", newId);
  } catch (err) {
    console.error("Gagal membuat admin:", err);
  } finally {
    client.release(); // pastikan koneksi DB tertutup
  }
}

createAdmin();
