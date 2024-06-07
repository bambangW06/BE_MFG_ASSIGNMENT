var database = require("../../config/storage");
module.exports = {
  getParameter: async (req, res) => {
    try {
      const q = `SELECT * FROM tb_m_parameters WHERE param_id IN (6, 7)`;
      const client = await database.connect();
      const dataQuery = await client.query(q);
      const data = dataQuery.rows;
      client.release();
      //   console.log("Data yang dikirim ke frontend:", data);
      res.status(200).json({
        message: "Success to Get Data",
        data: data,
      });
    } catch (error) {
      console.error("Error:", error.message); // Mencetak pesan kesalahan
      console.error(error);
      res.status(500).json({
        message: "Failed to Get Data",
        error: error.message, // Mengirim pesan kesalahan ke frontend
      });
    }
  },
};
