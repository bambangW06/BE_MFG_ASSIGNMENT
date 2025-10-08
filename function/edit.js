const database = require("../config/storage"); // pastikan path sesuai
const moment = require("moment-timezone");

// ambil daftar kolom dari tabel
async function getTableColumns(tableName) {
  const client = await database.connect();
  try {
    const res = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
      [tableName]
    );
    return res.rows.map((row) => row.column_name);
  } finally {
    client.release();
  }
}

// fungsi utama untuk update dinamis
async function updateRow(tableName, pkField, pkValue, data) {
  const client = await database.connect();
  try {
    // ambil semua kolom dari tabel
    const columns = await getTableColumns(tableName);

    // ambil data lama dulu
    const oldDataRes = await client.query(
      `SELECT * FROM ${tableName} WHERE ${pkField} = $1`,
      [pkValue]
    );
    if (oldDataRes.rows.length === 0) {
      throw new Error(`Data with ${pkField}=${pkValue} not found`);
    }
    const oldData = oldDataRes.rows[0];

    // bandingkan dan cari kolom yang berubah / baru diisi
    const validFields = [];
    const values = [];
    let index = 1;

    for (const key of Object.keys(data)) {
      if (!columns.includes(key) || key === pkField) continue;
      const newVal = data[key];
      const oldVal = oldData[key];

      // kalau dari FE ada nilai dan berbeda dari DB
      if (newVal !== undefined && newVal !== null && newVal !== oldVal) {
        validFields.push(`${key} = $${index}`);
        values.push(newVal);
        index++;
      }
    }

    // kalau gak ada perubahan, keluar aja
    if (validFields.length === 0) {
      return { message: "No changes detected" };
    }

    // auto isi updated_dt
    if (columns.includes("updated_dt")) {
      const formattedNow = moment()
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");
      validFields.push(`updated_dt = '${formattedNow}'`);
    }

    const query = `
      UPDATE ${tableName}
      SET ${validFields.join(", ")}
      WHERE ${pkField} = $${index}
      RETURNING *;
    `;

    const result = await client.query(query, [...values, pkValue]);
    return result.rows[0];
  } finally {
    client.release();
  }
}

// export helper biar bisa dipakai di controller
module.exports = updateRow;
