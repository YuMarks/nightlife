var express = require('express');
var app = express();
require('dotenv').config();
var port = process.env.PORT;
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var session = require('express-session');
var GithubStrategy = require('passport-github').Strategy;
var secret = process.env.MY_SECRET;
var clientID = process.env.GITHUB_KEY;
var clientSecret = process.env.GITHUB_SECRET;
var path = require('path');
var auth = require('./routes/auth.js');
var mongoose = require('mongoose');
var oauthSignature = require('oauth-signature');  
var n = require('nonce')();  
var request = require('request');  
var qs = require('querystring');  
var _ = require('lodash');

app.use(cookieParser());
app.use(session({
    secret: secret,
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new GithubStrategy({
    clientID: clientID,
    clientSecret: clientSecret,
    callbackURL: 'https://nightlife-ymarks.c9users.io/auth/github/callback'
}, function(accessToken, refreshToken, profile, done){
  done(null, {
    accessToken: accessToken,
    profile: profile
  });
}));
passport.serializeUser(function(user, done){
   done(null, user); 
});
passport.deserializeUser(function(user, done){ // get the user from database and store in req.user
   done(null, user); 
});
app.get('/auth/github', passport.authenticate('github'));//configure routes for auth callback and error 
app.get('/auth/error', auth.error);
app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/auth/error'}),
    function(req, res){
    if(req.user.profile.id){
       req.session.username = req.user.profile.username  // User's Git Hub username
       req.session.userID = req.user.profile.id;        // User's Git Hub id
       console.log(req.session.username);
    } else{
        req.session.userID = undefined;
    }
    console.log("The userID is " + req.session.userID);
    res.redirect('/');
    });

app.use(express.static(path.join(__dirname, 'views')));  
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views'));



var request_yelp = function(set_parameters, callback) {

  /* The type of request */
  var httpMethod = 'GET';

  /* The url we are using for the request */
  var url = 'http://api.yelp.com/v2/search';

  /* We can setup default parameters here */
  var default_parameters = {
    location: 'San+Francisco',
    sort: '2'
  };

  /* We set the require parameters here */
  var required_parameters = {
    oauth_consumer_key : process.env.oauth_consumer_key,
    oauth_token : process.env.oauth_token,
    oauth_nonce : n(),
    oauth_timestamp : n().toString().substr(0,10),
    oauth_signature_method : 'HMAC-SHA1',
    oauth_version : '1.0'
  };

  /* We combine all the parameters in order of importance */ 
  var parameters = _.assign(default_parameters, set_parameters, required_parameters);

  /* We set our secrets here */
  var consumerSecret = process.env.consumerSecret;
  var tokenSecret = process.env.tokenSecret;

  /* Then we call Yelp's Oauth 1.0a server, and it returns a signature */
  /* Note: This signature is only good for 300 seconds after the oauth_timestamp */
  var signature = oauthSignature.generate(httpMethod, url, parameters, consumerSecret, tokenSecret, { encodeSignature: false});

  /* We add the signature to the list of paramters */
  parameters.oauth_signature = signature;

  /* Then we turn the paramters object, to a query string */
  var paramURL = qs.stringify(parameters);

  /* Add the query string to the url */
  var apiURL = url+'?'+paramURL;

  /* Then we use request to send make the API Request */
  request(apiURL, function(error, response, body){
      //console.log(body);
    return testFunction(error, response, body);
  });

};
function testFunction(error, response, body){
    console.log("made it");
    var output = JSON.stringify(body);
    console.log(output[0].id);
}


app.get('/', function(req, res){
  request_yelp({
    location: 'North Canton',
    term: 'Coffee',
    sort: '2'
  }, testFunction());
    
   res.render('index',
        {userID: req.session.userID,
        }); 
});

app.listen(port, function(){
    console.log("Node.js is listening on port " + port + "...");
});

