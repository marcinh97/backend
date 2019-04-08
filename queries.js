// const Pool = require('pg').Pool
// const pool = new Pool({
//     user: 'ZpiAdmin@serverzpi',
//     host: 'serverzpi.postgres.database.azure.com',
//     database: 'savingapp',
//     password: 'Zpi?kam1lNOWAK',
//     port: 5432,
//     ssl: true
// });
const pg = require('pg')
var client = new pg.Client({
    user: 'ZpiAdmin@serverzpi',
    host: 'serverzpi.postgres.database.azure.com',
    database: 'savingapp',
    password: 'Zpi?kam1lNOWAK',
    port: 5432,
    ssl: true
});

client.connect()

const getUsers = (request, response) => {
    client.query('SELECT * FROM public."GeoLocations"', (error, results) => {
        if (error) {
            throw error
        }
        var res = results.rows;
        response.status(200).json(res)
    })
}

module.exports = {
    getUsers:getUsers
}