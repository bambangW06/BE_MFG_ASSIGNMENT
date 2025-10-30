var database = require("../../config/storage");
const { getStdChemical } = require("../../function/stdChemical");

module.exports = {
  getHistoryChemical: async (req, res) => {
    let client;
    try {
      const data = req.query;
      client = await database.connect();
      let q;

      if (data.table === "usage") {
        let baseSelect = `
    SELECT 
      u.*, 
      COALESCE(m.root_line_id, u.line_id) AS line_id,
      l.line_nm,
      m.machine_nm
    FROM tb_r_oil_usage AS u
    LEFT JOIN tb_m_machines AS m ON u.machine_id = m.machine_id
    LEFT JOIN tb_m_lines AS l ON COALESCE(m.root_line_id, u.line_id) = l.line_id
    WHERE u.created_dt >= '${data.start} 07:00:00'
    AND u.created_dt < '${data.end} 07:00:00'
  `;

        let filters = [];

        // CASE 1: machine_id
        if (data.machine_id) {
          filters.push(`u.machine_id = ${data.machine_id}`);
        }

        // CASE 2: line_id tanpa machine_id
        else if (data.line_id) {
          const machinesQuery = await client.query(
            `SELECT machine_id FROM tb_m_machines WHERE root_line_id = ${data.line_id}`
          );
          const machineIds = machinesQuery.rows.map((m) => m.machine_id);

          filters.push(`
      (
        ${
          machineIds.length > 0
            ? `u.machine_id IN (${machineIds.join(",")})`
            : "FALSE"
        }
        OR (u.machine_id IS NULL AND u.line_id = ${data.line_id})
      )
    `);
        }

        // CASE 3: oil_id
        if (data.oil_id) {
          filters.push(`u.oil_id = ${data.oil_id}`);
        }

        // 🆕 CASE 4: note_nm
        if (data.note_nm) {
          filters.push(`LOWER(u.note_nm) LIKE LOWER('%${data.note_nm}%')`);
        }

        // Gabungkan semua filter tambahan
        if (filters.length > 0) {
          baseSelect += " AND " + filters.join(" AND ");
        }

        baseSelect += " ORDER BY u.created_dt DESC";

        q = baseSelect;
      }

      // --- TABLE PARAMETER ---
      else {
        q = `
        SELECT *
        FROM tb_r_parameters_check
        WHERE machine_id = ${data.machine_id}
        AND created_dt >= '${data.start} 07:00:00'
        AND created_dt < '${data.end} 07:00:00'
      `;

        // // 🔹 Log debug
        // console.log("🧩 Fetching STD Data with params:", {
        //   line_id: data.line_id,
        //   machine_id: data.machine_id,
        // });

        const std = await getStdChemical(data.line_id, data.machine_id);
        // console.log("📊 STD Data result:", std);

        const userDataQuery = await client.query(q);
        const userData = userDataQuery.rows;

        client.release();

        return res.status(200).json({
          message: "Success to Get Data",
          data: userData,
          std_data: std || {},
        });
      }

      // --- Eksekusi query untuk usage ---
      const userDataQuery = await client.query(q);
      const userData = userDataQuery.rows;
      client.release();

      res.status(200).json({
        message: "Success to Get Data",
        data: userData,
      });
    } catch (error) {
      if (client) client.release();
      console.log(error);
      res.status(500).json({
        message: "Failed to Get Data",
        error: error.message,
      });
    }
  },
};
