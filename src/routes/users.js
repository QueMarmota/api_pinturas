const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
var userModel = require('../models/user');
const checkAuth = require('../middleware/chech-auth')
//need to import database configuration cuz we need to instantiate the pool so we dont lost connection pool
const { database } = require('../keys');

var salt = bcrypt.genSaltSync(10);
var hash = bcrypt.hashSync("B4c0/\/", salt);


//Get all users
router.get('/', checkAuth, (req, res) => {
    //instantiate pool conection every petition created
    var mysql = require('mysql2');
    var mysqlConnection = mysql.createConnection(database);
    //open connection if went closed
    mysqlConnection.connect(function (err, connection) {
        if (err) throw err; // not connected!
        //after the query ends the connection its released

        mysqlConnection.query('SELECT * FROM users', (err, rows, fields) => {
            if (!err) {
                // res.json(rows);
                res.status(200).json(rows);
                return;
            } else {
                console.log(err);
                return;
            }
        });


    });


});

// GET An user by id
router.get('/:id', checkAuth, (req, checkAuth, res) => {
    const { id } = req.params;
    //instantiate pool conection every petition created
    var mysql = require('mysql2');
    var mysqlConnection = mysql.createConnection(database);

    mysqlConnection.connect(function (err, connection) {
        if (err) throw err; // not connected!

        mysqlConnection.query('SELECT * FROM users WHERE id = ?', [id], (err, rows, fields) => {
            if (rows.length <= 0)
                throw response.status(404).json({
                    "status": "error",
                    "message": "Usuario no encontrado"
                });
            if (!err) {
                res.json(rows[0]);
            } else {
                console.log(err);
            }
        });
    });
});

// Sign-In An User
router.post('/signin', (req, response) => {
    var validUser = userModel(req.body)
    var error = validUser.validateSync();
    if (error) throw error;

    //#region BCRYPTJS
    bcrypt.genSalt(10, function (err, salt) {
        if (err) {
            return response.status(500).json({
                error: err
            })
        }
        bcrypt.hash(req.body.password, salt, function (err, hash) {
            // Store hash in your password DB.
            if (err) {
                return response.status(500).json({
                    error: err
                })
            }
            else {
                //store the encrypted password
                validUser.password = hash;

                //instantiate pool conection every petition created
                var mysql = require('mysql2');
                var mysqlConnection = mysql.createConnection(database);
                //open connection if went closed
                mysqlConnection.connect(function (err, connection) {
                    if (err) throw err; // not connected!
                    mysqlConnection.query("INSERT INTO users set ?", validUser.toJSON(), function (err, res) {
                        // When done with the connection, release it.
                        // mysqlConnection.destroy();
                        if (!err) {

                            const json = {
                                "status": "success",
                                "message": "Usuario registrado"
                            };
                            response.status(200).json(json);
                        }
                        else {
                            const json = {
                                "status": "error",
                                "data": err,
                                "message": "Error"
                            };
                            console.log("error: ", err);
                            response.status(500).json(json);
                        }
                    });
                });
            }
        });
    });
});


//Login a user
router.post('/login', (req, response, next) => {
    var validUser = userModel(req.body)
    const error = validUser.validateSync();
    //if email dosent match with the model regex
    if (error) throw error;

    //instantiate pool conection every petition created
    var mysql = require('mysql2');
    var mysqlConnection = mysql.createConnection(database);

    mysqlConnection.connect(function (err, connection) {
        if (err) throw err; // not connected!
        //search user by email
        mysqlConnection.query("Select * from users where email = ? ", validUser.email, function (err, resSQL, rows) {
            // When done with the connection, release it.
            // mysqlConnection.release();
            // no user finded with that email
            if (resSQL.length == 0) {
                console.log("Error usuario no encontrado");
                const json = {
                    "status": "error",
                    "data": err,
                    "message": "Error usuario no encontrado"
                };
                response.status(403).json(json);

            }
            else if (!err) {
                //if the user is signed
                storedPassword = resSQL[0].password;
                // console.log('Stored password ', storedPassword);
                // console.log('Incoming password ', req.body.password);

                //#region BCRYPT
                //esta funcion viene en la documentacion de bcryp la cual dice que compara  la hash de la data base con la hash que recibe y dice si hacen match o no
                bcrypt.compare(req.body.password, storedPassword, (err, res) => {
                    if (err) {
                        //if the password doesnth match with the stored one
                        return response.status(401).json({
                            message: 'Autorización Fallida',
                            status: "error",

                        });
                    }
                    if (res) {
                        //guardamos la funcion jwt la cual su funcionalidad viene en la documentacion de jsonwebtokens
                        const token = jwt.sign({
                            email: resSQL[0].email,
                            idUser: resSQL[0]._id,
                            nombre: resSQL[0].name,
                        },
                            //Secret key
                            'Knd@321'
                            ,
                            {
                                expiresIn: "1h"
                            }, { algorithm: 'RS256' });
                        console.log('Token', token);
                        return response.status(200).json({
                            status: "success",
                            message: 'Autorización exitosa',
                            data: {
                                "name": resSQL[0].name,
                                "email": resSQL[0].email,
                                "id": resSQL[0].id,
                                "token":token
                            }
                        })
                    }
                    return response.status(401).json({
                        message: 'Autorización Fallida',
                        status: "error",
                    });
                })
                //#endregion
            } else {//if error while searching the user by email
                const json = {
                    "status": "error",
                    "data": err,
                    "message": "Error en el servidor al solicitar la petición"
                };
                response.status(500).json(json);

            }
        });


    });

});


// update an user
router.put('/:id', checkAuth, (request, response, next) => {
    const id = request.params.id;
    //instantiate pool conection every petition created
    var mysql = require('mysql2');
    var mysqlConnection = mysql.createConnection(database);
    //codigo si no se va actualizar contraseña
    if (request.body.password == undefined) {
        mysqlConnection.connect(function (err, connection) {
            if (err) throw err; // not connected!
            mysqlConnection.query('UPDATE users SET ? WHERE _id = ?', [request.body, id], (error, resSQL) => {
                if (error) throw error;
                return response.status(200).json({
                    status: "success",
                    message: 'Actualizacion exitosa',

                })
            });
        });

    } else {
        //codigo si quiere actualizar contraseña
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                return response.status(500).json({
                    error: err + 'Error en bcrypt'
                })
            }
            bcrypt.hash(request.body.password, salt, function (err, hash) {
                //if error in bcryptjs
                if (err) {
                    return response.status(500).json({
                        error: err + 'Error en bcrypt'
                    })
                }
                else {
                    //new password hashed
                    request.body.password = hash;
                    // Store hash in your password DB.
                    mysqlConnection.connect(function (err, connection) {
                        if (err) throw err; // not connected!

                        mysqlConnection.query('UPDATE users SET ? WHERE _id = ?', [request.body, id], (error, resSQL) => {
                            if (error) throw error;
                            return response.status(200).json({
                                status: "success",
                                message: 'Actualizacion exitosa',

                            })
                        });
                    });

                }//fin else si no existio problema con bcrypt
            });
        });//fin funcion bcrypt
    }//fin else
})


router.delete('/:id', checkAuth, (req, res, next) => {
    const id = req.params.id;
    //instantiate pool conection every petition created
    var mysql = require('mysql2');
    var mysqlConnection = mysql.createConnection(database);
    mysqlConnection.connect(function (err, connection) {
        if (err) throw err; // not connected!
        mysqlConnection.query('DELETE FROM users WHERE _id = ?', id, (error, resSQL) => {
            if (error) throw error;
            if (resSQL.affectedRows > 0) {
                return res.status(200).json({
                    status: "success",
                    message: 'Usuario borrado',

                })
            } else {
                return res.status(403).json({
                    status: "error",
                    message: 'Usuario no encontrado',

                })
            }

        });
    });

});


module.exports = router;