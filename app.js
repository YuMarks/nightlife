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
passport.deserializeUser(function(user, done){
   done(null, user); 
});
app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login'}),
    function(req, res){
    res.redirect('/');
    });

app.use(express.static(path.join(__dirname, 'views')));  
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views'));


app.listen(port, function(){
    console.log("Node.js is listening on part" + port + "...");
});

