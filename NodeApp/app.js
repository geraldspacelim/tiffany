const express = require('express')
const sql = require("./connection")
const {nanoid} = require('nanoid')
var jwt = require('jsonwebtoken');
var cors = require('cors')

require('dotenv').config();

const app = express()
const port = process.env.PORT || 3080

app.use(cors({origin:true,credentials: true}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get('/api/allRequests', authenticateToken, (req, res) => {
    sql.query(`select requests.uuid, requests.userId, users.username, requests.dateApplied, requests.reason, requests.status from requests inner join users on requests.userId=users.userId`, (error, result)=> {
        if (error) throw error; 
        res.send(result);
    })
})

app.post('/api/newUser', authenticateToken, (req, res) => {
    const userId = req.body.userId
    const username = req.body.username 
    const dateTimeJoined = new Date().toLocaleString('en-US', {timeZone: 'Asia/Singapore'})
    sql.query(`insert into users (userId, username, dateTimeJoined) values (${userId}, '${username}', '${dateTimeJoined}') on duplicate key update username = '${username}'`, (error, results) => {
        if (error) throw error; 
        res.send(results)
    })
})

app.post('/api/newRequest', authenticateToken, (req,res) => {
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

app.delete('/api/deleteRequest/:id', authenticateToken, (req, res) => {
    const uuid = req.params.id 
    sql.query(`delete from requests where uuid = '${uuid}'`, (error, results) => {
        if (error) throw error; 
        res.send(results)
    })
})

app.post('/api/updateStatus', authenticateToken, (req, res) => {
    const uuid = req.body.uuid
    const status = req.body.status 
    sql.query(`update requests set status = '${status}' where uuid = '${uuid}'`, (error, results) => {
        if (error) throw error;
        res.send(results)
    })
})

app.get('/api/availableSlots/:id', authenticateToken, (req, res) => {
    const date = req.params.id 
    sql.query(`select * from slots where currentDate = '${date}'`, (error, results) => {
        if (error) throw error; 
        res.send(results)
    })
})

app.post('/api/reduceCount', authenticateToken, (req, res) => {
    const date = req.body.date
    sql.query(`update slots set availableSlots = availableSlots - 1 where currentDate = '${date}';`, (error, results) => {
        if (error) throw error;
        res.send(results)
    })
})

app.get('/api/getMyRequests/:id', authenticateToken, (req, res) => {
    const userId = req.params.id
    sql.query(`select * from requests where userId = ${userId}`, (error, results) => {
        if (error) throw error; 
        res.send(results)
    })
})

app.get('/api/checkDuplicate', authenticateToken, (req, res) => {
    const userId = req.query.userId
    const date = req.query.date 
    sql.query(`select count(dateApplied) from requests where userId = ${userId} and dateApplied = '${date}'`, (error, results) => {
        if (error) throw error; 
        res.send(results)
    })
})

app.post('/api/getToken', (req, res) => {
    const username = req.body.username
    const user = { user: username}

    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET) 
    res.json({accessToken: accessToken})
})

function authenticateToken(req, res, next) {
    const authHeader= req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] 
    if (token == null) return res.sendStatus(401) 

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403) 
        next()
    })
}

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})
