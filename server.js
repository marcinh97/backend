const db = require('./queries')



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
    sslmode: 'required'
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


    const selectQuery = 'SELECT * FROM public."UserReg" WHERE "email"=' + '\'' + email + '\' AND "password"=' + '\'' + password + '\'';
    await client.connect();
    await client.query(selectQuery)
        .then(res => {
            if (res.rows.length <= 0) {
                response.writeHead(404, {'Content-Type': 'text/event-stream'});
                response.send();
                response.end();

            } else {
                response.writeHead(200, {'Content-Type': 'text/event-stream'});
                response.send();
                response.end();
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


    const client = new pg.Client(config);


    const selectQuery = 'SELECT * FROM public."UserReg" WHERE "email"=' + '\'' + email + '\' AND "password"=' + '\'' + password + '\'';
    const insertQuery = 'INSERT INTO public."UserReg" (firstname, lastname, email, password) VALUES ' + '(\' ' +  name + '\',\'' + lastName + '\',\'' + email + '\',\'' + password + '\')';

    console.log("Przed polaczeniem")

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
        console.log("Istnieje")
        response.writeHead(404, {'Content-Type': 'text/event-stream'});
        response.send();
        response.end();
    }
    else {
        console.log("Nie istnieje")
        await client.query(insertQuery);
        console.log("dodano")
        response.writeHead(200, {'Content-Type': 'text/event-stream'});
        response.send();
        response.end();
    }
});

