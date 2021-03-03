const express = require('express')
var cors = require('cors')
var https = require('https');
const app = express()
var fs = require('fs');
const dotenv = require('dotenv');
const multer = require('multer')

dotenv.config()

https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('slimopsollicitatie_xyz.crt'),
    ca: fs.readFileSync('slimopsollicitatie_xyz.ca-bundle')
}, app)
    .listen(3001, function () {
        console.log('Example app listening on port 3000! Go to https://slimopsollicitatie:3001/')
    })



const port = 3001
const hostname = 'localhost'

    , http = require('http')
    , path = require('path')
    , util = require('util');
const bodyParser = require("express");

app.use(cors())

const UPLOAD_FILES_DIR = "/var/www/afstudeer/SlimOpSollicitatieApi/uploads";
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, UPLOAD_FILES_DIR);
    },
    filename(req, file = {}, cb) {
        const {originalname: originalName} = file;
        let ogName = originalName.split('.')[0]
        console.log(originalName)
        cb(null, `${originalName}`);
    }
});

const upload = multer({storage});


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
    return new Promise((resolve, reject) => {
        pool.query('select * from slimopsol.job where email =' + "'" + email + "'", (err, res) => {
            jobs = res.rows
            resolve(jobs)
        })
    })
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


app.all("/users/getvidInDb",  bodyParser.text({type: '*/*'}), async (req, res) => {
    var email = req.query.email
    try {
        resul =  await getAllVidsFromUser(email)
        console.log(resul)
    } catch(e) {
        res.send("Error")
    }
    res.send(resul.toArray())
    res.end()
})

app.get("/users/getRecent:email", bodyParser.text({type: '*/*'}), async (req, res) => {
    var body = JSON.parse(req.body)
    console.log(body.email)
    var email = body.email.toString()
    try{
        resul = await get2MostRecentVids(email)
    }catch(e){
        res.send("error")
    }
    res.send(resul)
    res.end()
})

//update name to /getAllJobs?
app.get("/user/getAll", bodyParser.text({type: '*/*'}), async (req, res) => {
    var body = JSON.parse(req.body)
    var email = body.email.toString()
    try{
        resul = await getJobs(email)
    }catch(e){
        res.send("error")
    }
    res.send(resul)
    res.end()
})

app.get("/users/getfeedback", bodyParser.text({type: '*/*'}), async(req, res) =>{
    var body = JSON.parse(req.body)
    var vidname = body.vidname.toString()
    try{
        resul = await getFeedback(vidname)
        console.log(resul)
    }catch(e){
        res.send("error")
    }
    res.send(resul)
    res.end()
})

// uitgecomment omdat ik niet genoeg tijd heb om dit vandaag te testen, en de kans dat dit fout is is groter dan de get requests.

// app.all("/users/setFeedback",  bodyParser.text({type: '*/*'}), async (req, res) => {
//     var body = JSON.parse(req.body)
//     var vid = body.video
//     var feedback = JSON.stringify(body.feedback)

//     try{
//         await setFeedback(vid, feedback)
//     }catch(e){
//         console.log(e)
//     }
//     res.send("true")
//     res.end()
// })

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

app.all("/users/register",  bodyParser.text({type: '*/*'}), async (req, res) => {
    let user = {}
    console.log( "BODY:" + JSON.stringify(req.body))
    var body = JSON.parse(req.body)

    var email = body.email
    console.log(email)

    var pass = body.pass;
    var un = body.username;
    var cp = body.confPass;
    var vn = body.vn;

    console.log(pass)
    console.log(cp)
    console.log(un)
    console.log(vn)
    try{
        user = await register(email, pass, un, cp, vn)
        console.log(user)

    } catch(e){
        res.send("Error registering")
    }
    res.send(user)
    res.end()
})

app.all("/users/addJob",  bodyParser.text({type: '*/*'}), async (req, res) => {
    console.log( "BODY:" + JSON.stringify(req.body))
    var body = JSON.parse(req.body)

    var titel = body.titel;
    var inter = body.inter;
    var tech = body.tech;
    var email = body.email;

    console.log(titel)
    console.log(inter)
    console.log(tech)
    console.log(email)
    try{
        await makeNewJob(titel, inter, tech, null, email)
        console.log("Making a new job: " + titel  + " " + inter + " " + tech + " " +  email)

    } catch(e){
        res.send("Error Making the job")
    }
    res.send("OK")
    res.end()

})

app.all("/users/deletejob",  bodyParser.text({type: '*/*'}), async (req, res) => {
    console.log( "BODY:" + JSON.stringify(req.body))
    var body = JSON.parse(req.body)

    var titel = body.titel;
    var email = body.email;

    console.log(titel)
    console.log(email)
    try{
        await deleteJob(titel, email)
        console.log("Deleting the job: " + titel + " From user: " +  email)

    } catch(e){
        res.send("Error deleting the job")
    }
    res.send(true)
    res.end()

})

app.all("/users/updateUsername",  bodyParser.text({type: '*/*'}), async (req, res) => {
    var body = JSON.parse(req.body)
    console.log(body.email)
    var email = body.email.toString()
    var un = body.username.toString()
    var pass = body.password.toString()
    console.log(pass)
    console.log(un)

    try {
        checkpass = await login(email, pass)
        console.log(resul)
    } catch(e) {
    } if(checkpass.email){
        await updateUsername(un, email)
    } else console.log("Error, Wrong password/email")

    res.send("Username updated")
    res.end()
})

app.all("/users/vidInDb",  bodyParser.text({type: '*/*'}), async (req, res) => {
    console.log( "BODY:" + JSON.stringify(req.body))
    var body = JSON.parse(req.body)

    var name = body.name;
    var email = body.email
    var timestamps = body.timestamps;

    console.log(name)
    console.log(email)
    console.log(timestamps)
    try{
        await videoInDb(name, email, timestamps)
        console.log("Saving the video")
    } catch(e){
        res.send("Error saving the video")
    }
    res.send("Ok")
    res.end()

})

app.post("/upload", upload.any() , async function (req, res) {
})

app.get("/video/:name", function(req, res){
    const range = req.headers.range;
    if(!range){
        res.status(400).send("Requires header range")
    }

    const videoPath = "./uploads/" + req.params.name
    const videoSiza = fs.statSync(videoPath).size

    const chunksize = 10**7
    const start = Number(range.replace(/\D/g,""))
    const end = Math.min(start + chunksize, videoSiza -1 )

    const videoStream = fs.createReadStream(videoPath, {start, end})
    videoStream.pipe(res)

})


