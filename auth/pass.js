var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var session = require('express-session');
var GithubStrategy = require('passport-github2').Strategy;  // Needed current version with Github 3.0
var secret = process.env.MY_SECRET;
var clientID = process.env.GITHUB_KEY;
var clientSecret = process.env.GITHUB_SECRET;
var userIDNum;


module.exports = function(app){
app.use(passport.initialize()); //authentication middleware
app.use(passport.session());
passport.use(new GithubStrategy({ //authenticate using GitHub 
  clientID: clientID,
  clientSecret: clientSecret,
  //callbackURL: 'https://nightlife-ymarks.c9users.io/auth/github/callback'
  callbackURL: 'https://hidden-bastion-35960.herokuapp.com/auth/github/callback'
}, function(accessToken, refreshToken, profile, done){
  done(null, {
    accessToken: accessToken,
    profile: profile
  });
}));

passport.serializeUser(function(user, done) { //translates data into storable format
  done(null, user);
});

passport.deserializeUser(function(user, done) { // extrancts data
  done(null, user);
});

app.get('/logout', function(req, res){
   req.logout();
   req.session.userID = undefined;
   console.log("logging out");
   res.redirect('/');
});

app.get('/auth/github',  //starts the Git Hub login process
passport.authenticate('github'));

app.get('/auth/github/callback', // Git Hub calls this url
  passport.authenticate('github', { failureRedirect: '/login' }), //goes to Git Hub login page if failed to authenticate
  function(req, res) {
     
  if(req.session.userID){  // logout 
      req.session.userID = undefined;
      res.redirect('/');
  }
      
      var userID = req.user.profile.id;
      req.session.userID = userID;  
      var lastPageVisited = req.headers.referer;
      req.session.lastPageVisited = lastPageVisited;
      
    // successful login, redirect to lastPageVisited
    if(req.session.lastPageVisited === undefined){
        res.redirect('/');
        }else{
            res.redirect(req.session.lastPageVisited);
            }
  });
}
module.exports.userID = function(app){
    
}