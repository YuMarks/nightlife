var passport = require("passport");
var GithubStrategy = require('passport-github').Strategy;
var clientID = process.env.GITHUB_KEY;
var clientSecret = process.env.GITHUB_SECRET;

module.exports = function() {
    passport.serializeUser(function(user, done){
   done(null, user); 
});
passport.deserializeUser(function(user, done){ // get the user from database and store in req.user
   done(null, user); 
});
}

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