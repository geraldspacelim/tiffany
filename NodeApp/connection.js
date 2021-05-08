const mysql = require("mysql")

var connection = mysql.createPool({
    host: "209.97.175.18", 
    user: "admin", 
    password: "P@ssw0rd888",
    port: 3306, 
    database: "bookingbot"
})

// var connection = mysql.createConnection({
//     host: process.env.HOST, 
//     user: process.env.USER, 
//     password: process.env.PASSWORD,
//     port: process.env.PORT, 
//     database: process.env.DATABASE
// })

connection.getConnection((err, connection) => {
    if(err) throw err; 
    console.log(`Connected as ID ${connection.threadId}`)
})


module.exports = connection;