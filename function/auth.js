var jwt = require("jsonwebtoken");


module.exports = {
    generateToken: async (payload) => {
        var token = jwt.sign(payload, process.env.SECRET_KEY);
        return token;
    },
    verifyToken: async (req, res, next) => {
        try {
            console.log(req.headers);
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.SECRET_KEY);

            if (!decoded) {
                return res.status(401).json({
                    message: "Token is invalid",
                });
            }
             // Menambahkan informasi fullname ke objek req.decoded
        req.decoded = {
            ...decoded,
            fullname: decoded.fullname // Misalnya, fullname disimpan di dalam token
        };
        res.status(200).json({
            message: "Success",
            data: req.decoded
        })
            
        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: "Error brooo",
            });
            }
        },
    };
