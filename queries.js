const Pool = require('pg').Pool
const pool = new Pool({
    user: 'ZpiAdmin@serverzpi',
    host: 'serverzpi.postgres.database.azure.com',
    database: 'savingapp',
    password: 'Zpi?kam1lNOWAK',
    port: 5432,
    ssl: true
});

const getUsers = (request, response) => {
    pool.query('SELECT * FROM public."GeoLocations"', (error, results) => {
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