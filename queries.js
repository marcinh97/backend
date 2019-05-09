const Pool = require('pg').Pool
const pool = new Pool({
    user: 'ZpiAdmin@serverzpi',
    host: 'serverzpi.postgres.database.azure.com',
    database: 'savingapp',
    password: 'Zpi?kam1lNOWAK',
    port: 5432,
    ssl: true
});

// const pg = require('pg')
// var client = new pg.Client({
//     user: 'ZpiAdmin@serverzpi',
//     host: 'serverzpi.postgres.database.azure.com',
//     database: 'savingapp',
//     password: 'Zpi?kam1lNOWAK',
//     port: 5432,
//     ssl: true
// });

// client.connect()

const getUserReg = (request, response) => {
    pool.connect((err, client, release) => {
        if (err) {
            return console.error('Error acquiring client', err.stack)
        }
        client.query('SELECT * FROM public."GeoLocations"', (error, results) => {
            release()
            if (error) {
                throw error
            }
            var res = results.rows;
            response.status(200).json(res)
        })
    })
}

const getUsers = (request, response) => {
    pool.connect((err, client, release) => {
        if (err) {
            return console.error('Error acquiring client', err.stack)
        }
        client.query('SELECT * FROM public."GeoLocations"', (error, results) => {
            release()
            if (error) {
                throw error
            }
            var res = results.rows;
            response.status(200).json(res)
        })
    })
    // pool.query('SELECT * FROM public."GeoLocations"', (error, results) => {
    //     if (error) {
    //         throw error
    //     }
    //     var res = results.rows;
    //     response.status(200).json(res)
    // })
    // response.status(200).json('Hejka co ty tu robisz?')
}


module.exports = {
    getUsers:getUsers
}