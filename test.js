var express = require('express');
var app = express();
require('dotenv').config();
var port = process.env.PORT;
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var session = require('express-session');
var GithubStrategy = require('passport-github2').Strategy;  // Needed current version with Github 3.0
var secret = process.env.MY_SECRET;
var clientID = process.env.GITHUB_KEY;
var clientSecret = process.env.GITHUB_SECRET;
var path = require('path');
//var auth = require('./routes/auth.js');
var userID = undefined;
var passModule = require('./auth/pass');



app.use(express.static(path.join(__dirname, 'views')));  
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views'));

app.get('/', function(req, res){
   if(req.session.userID){
       console.log(true);
   }else{
       console.log(false);
   }
   console.log(userID);
   
   res.render('index',
        {userID: userID,
        }); 
});
require('./auth/pass')(app);

app.listen(port, function(){
    console.log("Node.js is listening on port " + port + "...");
});

