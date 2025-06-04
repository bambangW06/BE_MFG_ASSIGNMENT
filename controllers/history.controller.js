var database = require("../config/storage");

module.exports = {
  getHistory: async (req, res) => {
    try {
      // Ambil parameter selectedMonth dari query, jika ada
      const { selectedMonth } = req.query;

     const monthCondition = selectedMonth
  ? `
    EXTRACT(MONTH FROM a.date_absence) = EXTRACT(MONTH FROM TO_DATE('${selectedMonth}-01', 'YYYY-MM-DD'))
    AND EXTRACT(YEAR FROM a.date_absence) = EXTRACT(YEAR FROM TO_DATE('${selectedMonth}-01', 'YYYY-MM-DD'))
    `
  : `
    EXTRACT(MONTH FROM a.date_absence) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM a.date_absence) = EXTRACT(YEAR FROM CURRENT_DATE)
    `;


      // Query untuk mengambil data dari database dengan kondisi bulan dinamis
      const q = `
        SELECT 
          a.*, 
          e.shift
        FROM  
          tb_m_absences a
        JOIN 
          tb_m_employees e ON a.employee_id = e.employee_id
        WHERE 
          ${monthCondition} -- Kondisi bulan dinamis
        ORDER BY 
          date_absence DESC;
      `;

      const client = await database.connect();
      const userDataQuery = await client.query(q);
      const userData = userDataQuery.rows;
      client.release();

      // Pengelompokan data berdasarkan shift dan status
      let redShiftHadir = [];
      let redShiftLibur = [];
      let whiteShiftHadir = [];
      let whiteShiftLibur = [];

      userData.forEach((item) => {
        if (item.shift === "Red") {
          if (item.status === "Hadir") {
            redShiftHadir.push(item);
          } else {
            redShiftLibur.push(item);
          }
        } else if (item.shift === "White") {
          if (item.status === "Hadir") {
            whiteShiftHadir.push(item);
          } else {
            whiteShiftLibur.push(item);
          }
        }
      });

      // Kembalikan data yang dikelompokkan sebagai respons JSON
      res.status(200).json({
        message: "Success to Get Data",
        data: {
          redShiftHadir,
          redShiftLibur,
          whiteShiftHadir,
          whiteShiftLibur,
        },
      });
    } catch (error) {
      console.error("Error fetching employee data:", error);
      res.status(500).json({
        message: "Failed to Get Data",
      });
    }
  },
};
