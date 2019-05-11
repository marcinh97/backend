const db = require('./queries')

const bcrypt = require('bcrypt')

const app = require('./server_stuff');

app.get('/users', db.getUsers);

app.set('port', process.env.PORT || 3000);
const pg = require('pg');
const server = app.listen(app.get('port'), () => {
    console.log(`Listening on ${ server.address().port }`);
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
            const selectQuery = 'SELECT * FROM public."Users" WHERE "id"=' + '\'' + id + '\'';

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
        res.writeHead(200, {'Content-Type': 'text/event-stream'});
        res.write('' + ticket.getPayload().given_name);
        res.send();
        checkOrSaveUser(ticket.getUserId(), ticket.getPayload().given_name, ticket.getPayload().family_name, ticket.getPayload().email);
    }
    verify().catch(console.error);

});

const config = {
    host: 'serverzpi.postgres.database.azure.com',
    user: 'ZpiAdmin@serverzpi',
    password: 'Zpi?kam1lNOWAK',
    database: 'savingapp',
    port: 5432,
    ssl: true
};

function checkOrSaveUser(id, name, lastName, email) {
    const client = new pg.Client(config);

    client.connect(err => {
        if (err){
            console.log(err)
        }
        else {
            console.log(id);
            const selectQuery = 'SELECT * FROM public."Users" WHERE "id"=' + '\'' + id + '\'';
            console.log(selectQuery);
            const query = 'INSERT INTO public."Users" VALUES ' + '(\' ' +  name + '\',\'' + lastName + '\',\'' + email + '\',\'' + id + '\')';

            client.query(selectQuery)
                .then(res => {
                    const rows = res.rows;
                    console.log(rows.length);
                    if(res.rows.length>0)
                    {
                        console.log('ISTNIEJEEEE');
                    }
                    else
                    {
                        console.log("powinienem dodac przepraszam moj masterze");
                        client.query(query);
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


app.post("/userOffers", async function(request, response){
    let id = request.body.id;

    console.log('id: '+id);

    const client = new pg.Client(config);

    const selectQuery = 'SELECT * FROM "Offer" WHERE "userId"=' + '\'' + id + '\'';

    await client.connect();
    await client.query(selectQuery)
        .then(res => {
            if (res.rows.length <= 0) {
                response.status(404);

            } else {
                console.log('jeste tu');
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
    user: 'ZpiAdmin@serverzpi',
    host: 'serverzpi.postgres.database.azure.com',
    database: 'savingapp',
    password: 'Zpi?kam1lNOWAK',
    port: 5432,
    ssl: true
});

app.get('/offer', function(request, response){
    let id = request.query.id;
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
})
