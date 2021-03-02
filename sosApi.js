const express = require('express')
var cors = require('cors')
var https = require('https');
var fs = require('fs');
var privateKey  = fs.readFileSync('/etc/letsencrypt/live/slimopsollicitatie.xyz/privkey.pem', 'utf8');
var certificate = fs.readFileSync('/etc/letsencrypt/live/slimopsollicitatie.xyz/fullchain.pem', 'utf8');
var credentials = {key: privateKey, cert: certificate};
var httpsServer = https.createServer(credentials, app);

const app = express()

const port = 3001

    , http = require('http')
    , path = require('path')
    , util = require('util');
const bodyParser = require("express");

app.use(cors())
httpsServer.listen(port);

let jobs = []

const {Pool} = require('pg');
const { resolve } = require("path");
const { json } = require("body-parser");
const pool = new Pool({
    user: 'civracsv',
    host: 'dumbo.db.elephantsql.com',
    database: 'civracsv',
    password: 'vlubeHQ53ZlJ0XLNHnHvk_SyRDW0MIME',
    port: 5432,
})

function login(email, password) {
    //returns promise so that in createServer the await function works
    return new Promise((resolve, reject) => {
        pool.query('select * from slimopsol.users where email = ' + "'" + email + "'", (err, res) => {
            if (res.rowCount === 0) {
                console.log("foutje")
                return
            }

            let uname = res.rows[0].email
            let name = res.rows[0].username
            let pw = res.rows[0].hashedpassword.toString()
            let hashpw = hashCode(password).toString()
            console.log("pw in db: " + pw)
            console.log("Hashed gegeven pw: " + hashpw)
            let vnaam = res.rows[0].voornaam

            if (uname === email && hashpw === pw) {
                console.log("Ingelogd")
            } else {
                resolve("err")
                return
            }
            const user = {
                username: name,
                email: email,
                jobs: getJobs(email),
                voornaam: vnaam
            }
            resolve(user)
            return user
        })

    })
}

function register(email, password, username, confPass, voornaam) {
    return new Promise((resolve, reject) => {

        let hPassword = hashCode(password);
        let confHashPassword = hashCode(confPass);
        if (!email.includes("@") || confHashPassword.toString() !== hPassword.toString()) {
            resolve("Err")
            return "Err"
        }
        console.log("registering user with email: " + email + " password: " + password + " username: " + username)
        pool.query('insert into slimopsol.users(email, hashedpassword, username, voornaam) values' + "('" + email + "' , '" + hPassword + "' , '" + username + "', '" + voornaam + "')", (err, res) => {
            console.log("G")
            makeJob(email)
            resolve("OK")
        })
    })

}

function getJobs(email) {
    pool.query('select * from slimopsol.job where email =' + "'" + email + "'", (err, res) => {
        jobs = res.rows
    })
    return jobs
}

function makeJob(email) {
    pool.query('insert into slimopsol.job(titel, inter, tech, email, titelmail) values' + "('Ober','Klantvriendelijkheid', 'Opdienden', " + "'" + email + "'," + "'Ober" + email + "')", (err, res) => {
    })
}

function makeNewJob(titel, inter, tech, tech2, email) {
    pool.query('insert into slimopsol.job(titel, inter, tech, email, titelmail) values' + "('" + titel + "', '" + inter + "', '" + tech + "', '" + email + "', '" + titel + email + "')", (err, res) => {
        console.log('insert into slimopsol.job(titel, inter, tech, tech2, email, titelmail) values' + "('" + titel + "', '" + inter + "', '" + tech + "', '" + tech2 + "', '" + email + "', '" + titel + email + "')")
        console.log(err)
    })
}

function updateUsername(username, email) {
    return new Promise((resolve, reject) => {

        pool.query('update slimopsol.users set username =' + "'" + username + "'" + 'where email = ' + "'" + email + "'", (err, res) => {
            console.log("username changed")
            resolve("OK")

        })

    })
}

function updatePassword(password, email) {
    let hashpw = hashCode(password).toString()

    pool.query('update slimopsol.users set hashedpassword =' + "'" + hashpw + "'" + 'where email = ' + "'" + email + "'", (err, res) => {
        console.log("password changed")
    })
}

function deleteJob(title, email) {
    pool.query('delete from slimopsol.job where titelmail =' + "'" + title + email + "'", (err, res) => {
        console.log(err)
    })
}

function setFeedback(video, feedback) {
    pool.query('update slimopsol.videos set feedback =' + "'" + feedback + "'" + 'where videoname = ' + "'" + video + "'", (err, res) => {
        console.log(err)
        resolve("OK")
    })
}

function videoInDb(name, email, timestamps) {
    pool.query('insert into slimopsol.videos(videoname, email, timestamps) values (' + "'" + name + "', '" + email + "','" + timestamps + "')", (err, res) => {
        console.log(err)
    })
}

function getFeedback(vidname){
    return new Promise((resolve, reject) => {
        pool.query('select * from slimopsol.videos where videoname = ' + "'" + vidname + "'", (err, res) => {
            let resul = ""
            res.rows.forEach(row => {
                resul = row.feedback
            })
            resolve(resul)
        })
    })
}

function getAllVidsFromUser(email) {
    return new Promise((resolve, reject) => {

        pool.query('select * from slimopsol.videos where email = ' + "'" + email + "'", (err, res) => {
            let arr = []
            res.rows.forEach(row => {
                const vid = {
                    "name": row.videoname,
                    "timestamps": row.timestamps,
                }
                arr.push(vid)
            })
            resolve(arr)

        })
    })

}

function get2MostRecentVids(email) {
    return new Promise((resolve, reject) => {

        pool.query('select * from slimopsol.videos where email =' + "'" + email + "'" + 'order by videoname desc LIMIT 2', (err, res) => {
            let arr = []
            try{
                res.rows.forEach(row => {
                    arr.push(row.videoname)
                })
                resolve(arr)
            } catch (e) {
                resolve([])
            }

        })
    }) }

function hashCode(str) {
    var hash = 0, i, chr;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash;
}



app.get("/", (req, res) => {
    res.send("Hello world")
})



app.get("/users/getAllVids",  bodyParser.text({type: '*/*'}), async (req, res) => {
    var body = JSON.parse(req.body)
    console.log(body.email)
    var email = body.email.toString()
    try {
        resul =  await getAllVidsFromUser(email)
        console.log(resul)
    } catch(e) {
        res.send("Error")
    }
    res.send(resul)
    res.end()
})



app.all("/users/login",  bodyParser.text({type: '*/*'}), async (req, res) => {
    let user = {}
    console.log( "BODY:" + JSON.stringify(req.body))
    var body = JSON.parse(req.body)

    var email = body.email
    console.log(email)

    var pass = body.pass;
    console.log(pass)
        try{
            user = await login(email, pass)
            console.log(user)

        } catch(e){
            res.send("Error logging in")
        } try {
        user.jobs = await getJobs(email)
    } catch(e){

    }
        res.send(user)
        res.end()


})

