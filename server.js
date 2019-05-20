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


// let upload = multer();
app.post('/images',upload.array('fileItem',12),function (req, res) {
    var datetime = new Date(Date.now());
    var dateString = datetime.getFullYear()+'-'+datetime.getMonth()+'-'+datetime.getDay();
    console.log(dateString);
    console.log(req.body.name);
    console.log(req.body.description);
    console.log(req.body.category);
    var list = req.files;
    console.log(list.forEach((el,ind,[])=>console.log(el.url, ind)));


    const client = new pg.Client(config);
    client.connect(err => {
        if (err){
            console.log(err)
        }
        else {
            const selectQuery = 'INSERT INTO "Offer"("name","description","phone","categoryNum","status","userId","offerdate") values(\' ' + req.body.name + '\', \''+ req.body.description + '\',\'' + req.body.phone + '\''+',2,1, ' +  req.body.userId +', \'' + dateString +'\') RETURNING offerid;';
            var offerid;
            client.query(selectQuery)
                .then(res => {
                    offerid= res.rows[0].offerid;
                    list.forEach((el,ind,[])=>addPhoto(el.url,offerid));
                })
                .catch(err => {
                    console.log(err);
                });



        }
    });

    res.writeHead(200, {'Content-Type': 'text/event-stream'});
    res.send();

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
    }
    verify().catch(console.error);

});

// app.post('/additem',(req,res)=> {
//     console.log("ADD ITEM");
//     console.log(req.body.name);
//     // console.log(req.file) ;// to see what is returned to you
//     // const image = {};
//     // image.url = req.file.url;
//     // image.id = req.file.public_id;
//     // console.log(image.url);
//     res.writeHead(200, {'Content-Type': 'text/event-stream'});
//     res.write('' + 'OKAY!');
//     res.send();
// });
//
// app.post('/product', function(req,res){
//     console.log('/product');
//     console.log(req.body);
//     if(req.files)
//         req.files.forEach(function(file)
//         {
//             console.log(file);
//         })
// });


const config = {
    host: 'serverzpi.postgres.database.azure.com',
    user: 'ZpiAdmin@serverzpi',
    password: 'Zpi?kam1lNOWAK',
    database: 'savingapp',
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

//autoryzacja przy wejsciu
//onEnter={requireAuth}  wtedy to w Route
function requireAuth(nextState, replace, next) {
    if (!authenticated) {
        replace({
            pathname: "/login",
            state: {nextPathname: nextState.location.pathname}
        });
    }
    next();
};

const Pool = require('pg').Pool
const pool = new Pool({
    user: 'ZpiAdmin@serverzpi',
    host: 'serverzpi.postgres.database.azure.com',
    database: 'savingapp',
    password: 'Zpi?kam1lNOWAK',
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
            "JOIN public.\"GeoLocations\" loc ON loc.id = oferta.offerid" +
            "\tWHERE oferta.offerid="+id, (error, results) => {
            if (error) {
                throw error
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
