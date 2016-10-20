/**
 * Created by achyu on 17-Oct-16.
 */
var express=require('express');
var bodyParser=require('body-parser');
var connection=require('./connection');
var routes=require('./routes');
var path=require('path');
var session = require('express-session');
//var jwt=require('jsonwebtoken');
var expressJwt=require('express-jwt');

var app=express();
app.use(function(req,res,next){
    res.setHeader('Access-Control-Allow-Origin','*');
    next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set('views','./views');
app.set('view engine', 'ejs');
app.use('/views',express.static(__dirname + '/views'));
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));
//app.use(expressJwt({secret:'This app uses JWT.It is powerfull and cool'}).unless({path:['/getUserDetails/']}));

connection.init();
routes.configure(app);
var server=app.listen(80,function(){
    console.log('Port is: '+ server.address().port)});

