var database = require("../config/storage");

module.exports = {
  getHistory: async (req, res) => {
    try {
      // Deklarasi array untuk menampung data yang dikelompokkan
      let redShiftHadir = [];
      let redShiftLibur = [];
      let whiteShiftHadir = [];
      let whiteShiftLibur = [];

      // Query untuk mengambil data dari database
      const q = `
      SELECT 
        a.*, 
        e.shift
      FROM  
        tb_m_absences a
      JOIN 
        tb_m_employees e ON a.employee_id = e.employee_id
      WHERE 
        EXTRACT(MONTH FROM a.date_absence) = EXTRACT(MONTH FROM CURRENT_DATE) -- Hanya entri untuk bulan ini
      ORDER BY 
        date_absence DESC;
    `;

      const client = await database.connect();
      const userDataQuery = await client.query(q);
      const userData = userDataQuery.rows;
      client.release();

      // Pengelompokan data berdasarkan shift dan status
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

      // Log data yang dikelompokkan untuk memeriksa
      console.log("Red Shift Hadir:", redShiftHadir);
      console.log("Red Shift Libur:", redShiftLibur);
      console.log("White Shift Hadir:", whiteShiftHadir);
      console.log("White Shift Libur:", whiteShiftLibur);

      // Mengembalikan data yang dikelompokkan sebagai respons JSON
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
