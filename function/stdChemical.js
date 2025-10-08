const database = require("../config/storage");

async function getStdChemical(line_id, machine_id) {
  const client = await database.connect();
  const q = `
     (
        SELECT *, 1 AS priority
        FROM tb_m_std_chemicals
        WHERE line_id = $1 AND machine_id = $2 AND deleted_dt IS NULL
      )
        UNION ALL
      (
        SELECT *, 2 AS priority
        FROM tb_m_std_chemicals
        WHERE machine_id = $2 AND line_id IS NULL AND deleted_dt IS NULL
      )
      UNION ALL
      (
        SELECT *, 3 AS priority
        FROM tb_m_std_chemicals
        WHERE line_id = $1 AND machine_id IS NULL AND deleted_dt IS NULL
      )
      UNION ALL
      (
        SELECT *, 4 AS priority
        FROM tb_m_std_chemicals
        WHERE line_id IS NULL AND machine_id IS NULL AND deleted_dt IS NULL
      )
      ORDER BY priority
      LIMIT 1;
  `;
  const result = await client.query(q, [line_id, machine_id]);
  client.release();
  return result.rows[0] || null;
}

module.exports = { getStdChemical };
