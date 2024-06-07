const bcrypt = require("bcrypt");
const saltRounds = 10;

module.exports = {
    encryptPassword: (plainPassword) => {
        return new Promise((resolve, reject) => {
        bcrypt.hash(plainPassword, saltRounds, function (err, hash) {
            if (err) reject(err);
            resolve(hash);
        });
        });
    },
    comparePassword: (plainPassword, hashedPassword) => {
        console.log(plainPassword);
        return new Promise((resolve, reject) => {
        bcrypt.compare(plainPassword, hashedPassword, function (err, result) {
            if (err) reject(err);
            resolve(result);
        });
        });
    },
};