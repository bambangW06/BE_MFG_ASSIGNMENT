const axios = require("axios");
const moment = require("moment-timezone");

module.exports = {
  getGrafik: async (req, res) => {
    try {
      // Tangkap parameter query dari permintaan frontend
      const startDate = req.query.startDate;
      const endDate = moment(req.query.endDate)
        .add(1, "days")
        .format("YYYY-MM-DD");
      const machine_id = req.query.machine_id;
      const param_id = req.query.param_id;
      console.log("ini", startDate, endDate, machine_id);
      // Buat URL dengan parameter-query
      const url = `http://103.190.28.222:3300/api/v1/operational/parameter/graph?start=${startDate}&end=${endDate}&machines_id=${machine_id}&parameters_id=${param_id}`;
      console.log("iki lho", url);
      // Lakukan permintaan ke backend menggunakan URL yang telah dibuat
      const response = await axios.get(url, {
        headers: {
          authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiRmFqYXIgVHJpIENhaHlvbm8iLCJub3JlZyI6IjE2MjkwODMiLCJpYXQiOjE3MTM4NTk2MDh9.wOJoywj7KwqxuWN7Dji-zfmvKVD6O-_5QNGkCzaBuSg",
        },
      });

      const data = response.data;
      // Log hasil di sini
      console.log("Received data:", data);
      res.status(200).json({
        message: "Success to Get Data",
        data: data,
      });
    } catch (error) {
      console.error("Error:", error.message); // Mencetak pesan kesalahan
      console.error(
        "Status code:",
        error.response ? error.response.status : "Unknown"
      ); // Mencetak kode status respons jika tersedia
      res.status(500).json({
        message: "Failed to Get Data",
        error: error.message, // Mengirim pesan kesalahan ke frontend
      });
    }
  },
};
