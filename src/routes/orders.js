const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/chech-auth')
const { database } = require('../keys');

var orderModel = require('../models/order');

//Get all orders
router.get('/', checkAuth, (request, response) => {

    //instantiate pool conection every petition created
    var mysql = require('mysql2');
    var mysqlConnection = mysql.createConnection(database);

    mysqlConnection.connect(function (err, connection) {
        if (err) throw err; // not connected!
        mysqlConnection.query('SELECT * FROM orders', (error, rows, fields) => {
            if (error) throw error;
            //return the current rows from DB
            response.status(200).json(rows);
        });
    });
});

//Get order by id
router.get('/:id', checkAuth, (request, response) => {
    const { id } = request.params;

    //instantiate pool conection every petition created
    var mysql = require('mysql2');
    var mysqlConnection = mysql.createConnection(database);

    mysqlConnection.connect(function (err, connection) {
        if (err) throw err; // not connected!

        mysqlConnection.query('Select * from orders WHERE _id = ?', id, (error, rows, fields) => {
            if (error) throw error;
            if (rows.length <= 0)
                return response.status(404).json({
                    "status": "error",
                    "message": "Orden no encontrada"
                });
            response.status(200).json(rows[0]);
        });

    });
});

//Get order by idUser
router.get('/idUser/:id', checkAuth, (request, response) => {
    const { id } = request.params;
    //instantiate pool conection every petition created
    var mysql = require('mysql2');
    var mysqlConnection = mysql.createConnection(database);

    mysqlConnection.connect(function (err, connection) {
        if (err) throw err; // not connected!

        mysqlConnection.query('Select * from orders WHERE idUser = ?', id, (error, rows, fields) => {
            if (error) throw error;
            if (rows.length <= 0)
                return response.status(404).json({
                    "status": "error",
                    "message": "Orden no encontrada"
                });
            response.status(200).json(rows[0]);
        });
    });
});

//Create Order
router.post('/', checkAuth, (request, response) => {
    var validOrder = orderModel(request.body);
    var error = validOrder.validateSync();
    if (error) throw error;

    //instantiate pool conection every petition created
    var mysql = require('mysql2');
    var mysqlConnection = mysql.createConnection(database);

    mysqlConnection.connect(function (err, connection) {
        if (err) throw err; // not connected!

        mysqlConnection.query('INSERT INTO orders set ?', validOrder.toJSON(), (error, res) => {
            if (error) throw error;
            response.status(200).json({
                "status": "success",
                "message": "Orden registrada"
            });
        });
    });
});

//Update Order

router.put('/:id', checkAuth, (request, response) => {
    const id = request.params.id;
    var validOrder = orderModel(request.body);
    var error = validOrder.validateSync();
    if (error) throw error;

    //instantiate pool conection every petition created
    var mysql = require('mysql2');
    var mysqlConnection = mysql.createConnection(database);

    mysqlConnection.connect(function (err, connection) {
        if (err) throw err; // not connected!

        mysqlConnection.query('UPDATE orders SET ? WHERE _id = ?', [validOrder.toJSON(), id], (error, resSQL) => {
            if (error) throw error;
            return response.status(200).json({
                status: "success",
                message: "Actualización exitosa"
            });
        });
    });
});

//Delete order

router.delete('/:id', checkAuth, (request, response) => {
    const { id } = request.params;

    //instantiate pool conection every petition created
    var mysql = require('mysql2');
    var mysqlConnection = mysql.createConnection(database);

    mysqlConnection.connect(function (err, connection) {
        if (err) throw err; // not connected!

        mysqlConnection.query('DELETE FROM orders WHERE _id = ?', id, (error, res) => {
            if (error) throw error;

            return response.status(200).json({
                status: "success",
                message: "Borrado exitoso"
            })
        })
    });
});


//export the current router 
module.exports = router;