const express = require('express')
const sql = require("./connection")
const {nanoid} = require('nanoid')

require('dotenv').config();

const app = express()
const port = process.env.PORT || 3000

// Setup static directory to serve 
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get('/api/getUsers', (req, res) => {
    sql.query(`select * from users`, (error, result)=> {
        if (error) throw error; 
        res.send(result);
    })
})

app.post('/api/newUser', (req, res) => {
    const userId = req.body.userId
    const username = req.body.username 
    const dateTimeJoined = new Date().toLocaleString('en-US', {timeZone: 'Asia/Singapore'})
    sql.query(`insert into users (userId, username, dateTimeJoined) values (${userId}, '${username}', '${dateTimeJoined}') on duplicate key update username = '${username}'`, (error, results) => {
        if (error) throw error; 
        res.send(results)
    })
})

app.post('/api/newRequest', (req,res) => {
    const uuid = nanoid()
    const userId = req.body.userId
    const reason = req.body.reason 
    const dateApplied = req.body.dateApplied
    const dateTimePosted = new Date().toLocaleString('en-US', {timeZone: 'Asia/Singapore'})
    const status = "-"
    sql.query(`insert into requests (uuid, userId, reason, status, dateApplied, dateTimePosted) values ('${uuid}', '${userId}', '${reason}', '${status}', '${dateApplied}', '${dateTimePosted}')`, (error, results) => {
        if (error) throw error; 
        res.send(results)
    })
})

app.delete('/api/deleteRequest', (req, res) => {
    const uuid = req.body.uuid 
    sql.query(`delete from requests where uuid = '${uuid}'`, (error, results) => {
        if (error) throw error; 
        res.send(results)
    })
})

app.post('/api/updateStatus', (req, res) => {
    const uuid = req.body.uuid
    const status = req.body.status 
    sql.query(`update requests set status = '${status}' where uuid = ${uuid}`, (error, results) => {
        if (error) throw error;
        res.send(results)
    })
})

app.get('/api/availableSlots', (req, res) => {
    const date = req.query.date 
    sql.query(`select * from slots where currentDate = '${date}'`, (error, results) => {
        if (error) throw error; 
        res.send(results)
    })
})

app.post('/api/reduceCount', (req, res) => {
    const date = req.body.date
    sql.query(`update slots set availableSlots = availableSlots - 1 where currentDate = '${date}';`, (error, results) => {
        if (error) throw error;
        res.send(results)
    })
})

app.get('/api/getMyRequests', (req, res) => {
    const userId = req.query.userId
    sql.query(`select * from requests where userId = ${userId}`, (error, results) => {
        if (error) throw error; 
        res.send(results)
    })
})

app.get('/api/checkDuplicate', (req, res) => {
    const userId = req.query.userId
    const date = req.query.date 
    sql.query(`select count(dateApplied) from requests where userId = ${userId} and dateApplied = '${date}'`, (error, results) => {
        if (error) throw error; 
        res.send(results)
    })
})

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})
