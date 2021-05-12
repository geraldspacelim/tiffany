const mysql = require("mysql")

// to change
var connection = mysql.createPool({
    host: "209.97.175.18", 
    user: "admin", 
    password: "P@ssw0rd888",
    port: 3306, 
    database: "bookingbot"
})

connection.getConnection((err, connection) => {
    if(err) throw err; 
    console.log(`Connected as ID ${connection.threadId}`)
})


module.exports = connection;