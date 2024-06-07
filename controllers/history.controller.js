var database = require('../config/storage');

module.exports = {
    getHistory: async (req, res) => {
        try {
            const q = `
                    SELECT 
                        a.*, 
                        e.shift,
                        TO_CHAR(a.date_absence, 'YYYY-MM-DD') AS formatted_date_absence
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
            console.log("Data karyawan untuk chart:", userData); // Logging untuk memeriksa data karyawan sebelum dikirim
            res.status(200).json({
                message: "Success to Get Data",
                data: userData
            });
        } catch (error) {
            console.error('Error fetching employee data:', error);
            res.status(500).json({
                message: 'Failed to Get Data'
            });
        }
    }
}
