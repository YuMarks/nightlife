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
app.use(cookieParser());
app.use(session({
    secret: secret,
}));
app.use(passport.initialize());
app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login'}),
    function(req, res){
        if(req.user.profile.id){
         req.session.userID = req.user.profile.id;
    }   else{
         req.session.userID = undefined;
    }
        return(
           
        res.redirect('/')        
        );
    }); 
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
};

module.exports.userID = function(app){
    
}
