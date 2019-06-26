const db = require('./queries')
const bcrypt = require('bcrypt')
const app = require('./server_stuff');
app.get('/users', db.getUsers);
app.set('port', process.env.PORT || 3000);
const pg = require('pg');
const server = app.listen(app.get('port'), () => {
    console.log(`Listening on ${ server.address().port }`);
});

const multer = require("multer");
const cloudinary = require("cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name: 'daiq9mb50',
    api_key: '582769683868646',
    api_secret: 'GHvikB1kgtQeQYdgd94tlU-o9v8'
});
const storage = cloudinaryStorage({
    cloudinary: cloudinary,
    folder: "demo",
    allowedFormats: ["jpg", "png"],
    transformation: [{ width: 500, height: 500, crop: "limit" }]
});
// const parser = multer({ storage: storage });
var upload = multer({ storage: storage });

function getCategoryFromName(name)
{
    if(name==='jedzenie')
        return 1;
    if(name==='zabawki')
        return 2;
    if(name==='RTV/AGD')
        return 3;
    if(name==='ubrania')
        return 4;
    if(name==='akcesoria sportowe')
        return 5;
    if(name==='meble')
        return 6;
}

function addPhoto(photoUrl, offerID)
{
    const client = new pg.Client(config);
    client.connect(err => {
        if (err){
            console.log(err)
        }
        else {
            const query = "INSERT INTO \"Photos\" values('" + photoUrl + "', " + offerID + ", false);";
            client.query(query)
                .then(res => {
                    console.log("dodało zdjęcie");
                })
                .catch(err => {
                    console.log(err);
                });
        }
    });
}
// let upload = multer();
app.post('/images',upload.array('fileItem',12),function (req, res) {
    var datetime = new Date(Date.now());
    var dateString = datetime.getFullYear() + '-' + datetime.getMonth() + '-' + datetime.getDay();
    console.log(dateString);
    console.log(req.body.name);
    console.log(req.body.description);
    console.log(req.body.category);
    var list = req.files;
    console.log(list.forEach((el, ind, []) => console.log(el.url, ind)));


    const client = new pg.Client(config);
    client.connect(err => {
        if (err) {
            console.log(err)
        }
        else {
            const selectQuery = 'INSERT INTO "Offer"("name","description","phone","categoryNum","status","userId","offerdate") ' +
                'values(\' ' + req.body.name + '\', \'' + req.body.description + '\',\'' + req.body.phone + '\'' + ',' +
                getCategoryFromName(req.body.category) + ',1, ' + req.body.userId + ', \'' + dateString + '\') RETURNING offerid;';
            var offerid;
            client.query(selectQuery)
                .then(res => {
                    offerid = res.rows[0].offerid;
                    list.forEach((el, ind, []) => addPhoto(el.url, offerid));
                })
                .catch(err => {
                    console.log(err);
                });
        }
    });
});

app.post('/checkUser',function(req,res)
{
    const {OAuth2Client} = require('google-auth-library');
    const client = new OAuth2Client("545384910825-14gu3jrktnjfcjrntbv4t3akclpk2hn2.apps.googleusercontent.com");
    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: req.body.idtoken,
            audience: "545384910825-14gu3jrktnjfcjrntbv4t3akclpk2hn2.apps.googleusercontent.com",
        });
        const payload = ticket.getPayload();
        const userid = payload['sub'];
        res.writeHead(200, {'Content-Type': 'text/event-stream'});
        res.write('' + ticket.getPayload().given_name);
        res.send();
        checkIfExists(ticket.getUserId());
    }
    verify().catch(console.error);
});
function checkIfExists(id)
{
    const client = new pg.Client(config);
    client.connect(err => {
        if (err){
            console.log(err)
        }
        else {
            console.log(id);
            const selectQuery = 'SELECT * FROM "UserReg" WHERE "googleid"=' + '\'' + id + '\'';
            client.query(selectQuery)
                .then(res => {
                    const rows = res.rows;
                    console.log(rows.length);
                    if(res.rows.length>0)
                    {
                        return true;
                    }
                    else
                    {
                        return false;
                    }
                })
                .catch(err => {
                    console.log(err);
                });
        }
    });
}
app.post('/try', function(req, res){
    console.log("wysylam");
    const {OAuth2Client} = require('google-auth-library');
    const client = new OAuth2Client("545384910825-14gu3jrktnjfcjrntbv4t3akclpk2hn2.apps.googleusercontent.com");
    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: req.body.idtoken,
            audience: "545384910825-14gu3jrktnjfcjrntbv4t3akclpk2hn2.apps.googleusercontent.com",
        });
        const payload = ticket.getPayload();
        const userid = payload['sub'];

        var myid = await checkOrSaveUser(ticket.getUserId(), ticket.getPayload().given_name, ticket.getPayload().family_name, ticket.getPayload().email);
        console.log('uwaga' + myid);
        res.writeHead(200, {'Content-Type': 'text/event-stream'});
        res.write('' + myid );
        res.send();
        checkOrSaveUser(ticket.getUserId(), ticket.getPayload().given_name, ticket.getPayload().family_name, ticket.getPayload().email);
    }
    verify().catch(console.error);
});
const config = {
    host: 'charity-chain-zpi-2019.postgres.database.azure.com',
    user: 'agata@charity-chain-zpi-2019',
    password: 'Zpi?kam1lNOWAK',
    database: 'zpi',
    port: 5432,
    ssl: true
};

async function checkOrSaveUser(idg, name, lastName, email) {
    const client = new pg.Client(config);

    client.connect(err => {
        if (err){
            console.log(err)
        }
        else {
            console.log(idg);
            const selectQuery = 'SELECT * FROM "UserReg" WHERE "googleid"=' + '\'' + idg + '\'';
            console.log(selectQuery);
            const query = 'INSERT INTO \"UserReg\" ("firstname", "lastname", "email","googleid", "isgoogle") VALUES ' + '(\' ' +  name + '\',\'' + lastName + '\',\'' + email + '\',\'' + idg + '\', true ) RETURNING id;';

            client.query(selectQuery)
                .then(res => {

                    if(res.rows.length>0)
                    {
                        console.log(res.rows[0].id);
                        console.log('ISTNIEJEEEE');
                        return res.rows[0].id;
                    }
                    else
                    {
                        // console.log("powinienem dodac");
                        client.query(query)
                        .then (res =>
                        {
                            const id = res.rows[0].id;
                            console.log(res.rows[0].id);
                            return res.rows[0].id;
                        })
                    }

                })
                .catch(err => {
                    console.log(err);
                });
        }
    });
}

app.post("/tryLogin", async function(request, response){
    let password = request.body.password;
    let email = request.body.email;
    const client = new pg.Client(config);
    const selectQuery = 'SELECT * FROM "UserReg" WHERE "email"=' + '\'' + email + '\' AND "isgoogle"=' + '\'' + false + '\'';
    //const selectQuery = 'SELECT * FROM "UserReg" WHERE "email"=' + '\'' + email + '\' AND "password"=' + '\'' + hash + '\'';
    await client.connect();
    await client.query(selectQuery)
        .then(res => {
            if (res.rows.length <= 0) {
                console.log("brak takiego maila");
                response.writeHead(404, {'Content-Type': 'text/event-stream'});
                response.send();
                response.end();
            } else {
                bcrypt.compare(password,res.rows[0].password, function (err, result) {
                    if (result == true) {
                        console.log("jest mail i haslo");
                        response.writeHead(200, {'Content-Type': 'text/event-stream'});
                        response.write(''+res.rows[0].id);
                        response.send();
                        response.end();
                    } else {
                        console.log("jest mail ale bez hasla");
                        response.writeHead(404, {'Content-Type': 'text/event-stream'});
                        response.send();
                        response.end();
                    }
                });
            }
        })
        .catch(err => {
            console.log(err);
            return false;
        });
});
app.post("/register", async function(request, response) {
    let name = request.body.name;
    let lastName = request.body.username;
    let password = request.body.password;
    let email = request.body.email;
    let hash = bcrypt.hashSync(password, 10);
    const client = new pg.Client(config);
    const selectQuery = 'SELECT * FROM "UserReg" WHERE "email"=' + '\'' + email + '\' AND "isgoogle"=' + '\'' + false + '\'';
    const insertQuery = 'INSERT INTO \"UserReg\" (firstname, lastname, email, password, isgoogle) VALUES ' + '(\' ' +  name + '\',\'' + lastName + '\',\'' + email + '\',\'' + hash + '\' ,\''+false+'\') RETURNING id';
    await client.connect();
    var exist = await client.query(selectQuery)
        .then(res => {
            if (res.rows.length <= 0) {
                return false;
            } else {
                return true;
            }
        })
        .catch(err => {
            console.log(err);
            return false;
        });
    if(exist)
    {
        response.writeHead(404, {'Content-Type': 'text/event-stream'});
        response.send();
        response.end();
    }
    else {
        await client.query(insertQuery).then(res => {
            response.writeHead(200, {'Content-Type': 'text/event-stream'});
            response.write(''+res.rows[0].id);
        });
        response.send();
        response.end();
    }

});

app.post("/allOffers", async function(request, response){

    const client = new pg.Client(config);

    //const selectQuery = 'SELECT * FROM "Offer" JOIN "Photos" WHERE "userId"=' + '\'' + id + '\'';
    // const selectQuery = "SELECT * FROM public.\"Offer\" oferta\n" +
    //     "\tJOIN public.\"Photos\" AS photo ON photo.\"offerId\" = oferta.offerid\n" +
    //     "\tWHERE \"userId\"=" + '\'' + id + '\'';


    const selectQuery = "SELECT offerid, min(name) as name,min(description) as description, min(oferta.\"categoryNum\") as \"categoryNum\" ,min(status) as \"status\",min(url) as url FROM \"Offer\" as oferta LEFT JOIN \"Photos\" as photo on photo.\"offerId\" = oferta.offerId GROUP BY oferta.offerId";


    await client.connect();
    await client.query(selectQuery)
        .then(res => {
            if (res.rows.length <= 0) {
                response.status(404);

            } else {
                console.log('jeste tu');
                console.log(res.rows[0].categoryNum);
                response.send(JSON.stringify(res.rows));
                response.status(200);
            }
        })
        .catch(err => {
            console.log(err);
            return false;
        });
});

app.post("/userOffers", async function(request, response){
    let id = request.body.id;
    console.log('id: '+id);

    const client = new pg.Client(config);

    //const selectQuery = 'SELECT * FROM "Offer" JOIN "Photos" WHERE "userId"=' + '\'' + id + '\'';
    // const selectQuery = "SELECT * FROM public.\"Offer\" oferta\n" +
    //     "\tJOIN public.\"Photos\" AS photo ON photo.\"offerId\" = oferta.offerid\n" +
    //     "\tWHERE \"userId\"=" + '\'' + id + '\'';


    const selectQuery = "SELECT offerid, min(name) as name,min(description) as description, min(oferta.\"categoryNum\") as \"categoryNum\" ,min(status) as \"status\",min(url) as url FROM \"Offer\" as oferta left JOIN \"Photos\" as photo on photo.\"offerId\" = oferta.offerId WHERE \"userId\"=" + '\''+  id + '\'' +" GROUP BY oferta.offerId";


    await client.connect();
    await client.query(selectQuery)
        .then(res => {
            if (res.rows.length <= 0) {
                response.status(404);

            } else {
                console.log('jeste tu');
                console.log(res.rows[0].id);
                response.send(JSON.stringify(res.rows));
                response.status(200);
            }
        })
        .catch(err => {
            console.log(err);
            return false;
        });
});

const Pool = require('pg').Pool
const pool = new Pool({
    host: 'charity-chain-zpi-2019.postgres.database.azure.com',
    user: 'agata@charity-chain-zpi-2019',
    password: 'Zpi?kam1lNOWAK',
    database: 'zpi',
    port: 5432,
    ssl: true
});

app.get('/offer', function(request, response){
    let id = request.query.id;
    if (isFinite(id)){
        console.log("Id to: " + id)
        //response.json({info: id})
        pool.query("SELECT * FROM public.\"Offer\" oferta\n" +
            "\tJOIN public.\"Photos\" AS photo ON photo.\"offerId\" = oferta.offerid\n" +
            "JOIN public.\"GeoLocations\" loc ON loc.id = oferta.offerid\n" +
            // +" JOIN public.\"UserReg\" AS use ON use.id = oferta.\"userId\" " +
            "\tWHERE oferta.offerid="+id, (error, results) => {
            if (error) {
                console.log("Blad ")
                console.log("SELECT * FROM public.\"Offer\" oferta\n" +
                    "\tJOIN public.\"Photos\" AS photo ON photo.\"offerId\" = oferta.offerid\n" +
                    "JOIN public.\"GeoLocations\" loc ON loc.id = oferta.offerid\n" +
                    // +" JOIN public.\"UserReg\" AS use ON use.id = oferta.\"userId\" " +
                    "\tWHERE oferta.offerid="+id)
                return
            }
            var res = results.rows;
            response.status(200).json(res)
        })
        console.log("Aaaa: ")
        console.log(response)
    }
    else{
        response.status(200).json("")
    }
})