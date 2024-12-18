var database = require("../../config/storage");
const moment = require("moment-timezone");

module.exports = {
    getTimerange: async (req, res) => {
        try {
            let q =`SELECT * FROM tb_m_time_reports ORDER BY time_id ASC`;

            const client = await database.connect();
            const userDataQuery = await client.query(q);
            const userData = userDataQuery.rows;
            client.release();

            if(userData.length > 0){
                userData.forEach((row) => {
                    row.created_dt = moment(row.created_dt)
                        .tz("Asia/Jakarta")
                        .format("DD-MM-YYYY");
                });
            }

            res.status(200).json({
                message: "Success to Get Data",
                data: userData
            })
        } catch (error) {
            res.status(500).json({
                message: "Failed to Get Data",
                error: error
            });
            
        }
    },
    addTimerange: async (req, res) => {
        try {
            console.log('req.body', req.body);
            res.status(201).json({
                message: "Success to Add Data",
                data: req.body
            })
            
        } catch (error) {
            res.status(500).json({
                message: "Failed to Add Data",
                error: error
            });
            
        }
    },
}