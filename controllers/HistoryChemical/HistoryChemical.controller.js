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
        // --- CASE 1: Ada machine_id ---
        if (data.machine_id) {
          q = `
            SELECT *
            FROM tb_r_oil_usage
            WHERE machine_id = ${data.machine_id}
            AND created_dt >= '${data.start} 07:00:00'
            AND created_dt < '${data.end} 07:00:00'
          `;
        }

        // --- CASE 2: Ada line_id tapi tidak ada machine_id ---
        else if (data.line_id) {
          const machinesQuery = await client.query(
            `SELECT machine_id FROM tb_m_machines WHERE root_line_id = ${data.line_id}`
          );

          const machineIds = machinesQuery.rows.map((m) => m.machine_id);

          if (machineIds.length === 0) {
            client.release();
            return res.status(200).json({
              message: "No machines found for this line",
              data: [],
            });
          }

          q = `
            SELECT *
            FROM tb_r_oil_usage
            WHERE machine_id IN (${machineIds.join(",")})
            AND created_dt >= '${data.start} 07:00:00'
            AND created_dt < '${data.end} 07:00:00'
          `;
        }

        // --- CASE 3: Tidak ada machine_id maupun line_id ---
        else {
          q = `
            SELECT *
            FROM tb_r_oil_usage
            WHERE created_dt >= '${data.start} 07:00:00'
            AND created_dt < '${data.end} 07:00:00'
          `;
        }
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
        // 🔹 Tambahan log untuk debug
        console.log("🧩 Fetching STD Data with params:", {
          line_id: data.line_id,
          machine_id: data.machine_id,
        });
        // 🔹 Tambahan di sini: ambil data standar chemical-nya
        const std = await getStdChemical(data.line_id, data.machine_id);
        // 🔹 Log hasilnya
        console.log("📊 STD Data result:", std);

        // 🔹 Eksekusi query data parameter
        const userDataQuery = await client.query(q);
        const userData = userDataQuery.rows;

        client.release();

        return res.status(200).json({
          message: "Success to Get Data",
          data: userData,
          std_data: std || {}, // <--- biar tetap aman kalau gak ada hasil
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
