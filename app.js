var express = require('express');
var app = express();
require('dotenv').config();
var port = process.env.PORT;
var cookieParser = require('cookie-parser'); //populates req.cookies
var bodyParser = require('body-parser'); //parse incoming request bodies
var passport = require('passport');
var session = require('express-session'); //stores only a session identifier on the client within a cookie and session data in database
var GithubStrategy = require('passport-github').Strategy;
var secret = process.env.MY_SECRET; // computes the hash
var clientID = process.env.GITHUB_KEY;
var clientSecret = process.env.GITHUB_SECRET;
var path = require('path');
var auth = require('./routes/auth.js');
var dbInfo = process.env.MONGOLAB_URI;
var mongoose = require('mongoose');
var oauthSignature = require('oauth-signature'); //authorization standard
var request = require('request');
var qs = require('querystring'); // extract these from Express request object (url)  
var async = require('async'); // Manages asynchronous operation to complete one action before moving to  next
var sassMiddleware = require('node-sass-middleware');
var setUpPassport = require("./setuppassport");

var Going = require("./models/going");

setUpPassport();

mongoose.connect(dbInfo);

app.use(cookieParser());


app.use(session({
  secret: secret,
}));
app.use(passport.initialize());
app.use(passport.session());


app.get('/auth/github', passport.authenticate('github')); //use passport and specify github strategy
app.get('/auth/error', auth.error); //configure routes for auth callback and error
app.get('/auth/github/callback',
  passport.authenticate('github', {
    failureRedirect: '/auth/error'
  }),
  function(req, res) {
    if (req.user.profile.id) {
      req.session.username = req.user.profile.username; // User's Git Hub username
      req.session.userID = req.user.profile.id; // User's Git Hub id


    } else {
      req.session.userID = undefined;
    }

    res.redirect('/');
  });


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); //should this be path.resolve?
app.use(sassMiddleware({ // allows a sass file to be used and automatically generates a css file
  src: path.join(__dirname, 'views'),
  dest: path.join(__dirname, 'views'),
  debug: true,
  indentedSyntax: true,
  outputStyle: 'compressed',
  prefix: '/stylesheets'
}));
app.use(express.static(path.join(__dirname, 'views')));
app.use(bodyParser.urlencoded({
  extended: false
})); //read HTTP POST data, stored in req.body
var Yelp = require('yelp');

var yelp = new Yelp({
  consumer_key: process.env.oauth_consumer_key,
  consumer_secret: process.env.consumerSecret,
  token: process.env.oauth_token,
  token_secret: process.env.tokenSecret,
});

// See http://www.yelp.com/developers/documentation/v2/search_api


app.get('/', function(req, res) { // get search term and build array based off search


  req.cookies.cookieName = req.session.searchTerm;

  var itemsArr = [];

  if (req.session.searchTerm) {

    var searchTerm = req.session.searchTerm;
    yelp.search({
        term: 'coffee',
        limit: 20,
        sort: 2,
        location: searchTerm
      })
      .then(function(data) {

        async.each(data.businesses, function(item, callback) { // iterates over an array of items building array, then moves to callback function once array built

            var tempObj = {};
            tempObj.img = item.image_url;
            tempObj.name = item.name;
            tempObj.desc = item.snippet_text;
            tempObj.id = item.id;
            tempObj.date = item.date;
            tempObj.userFound = false; // will track if a user is not found in this businesses record
            //tempObj.loc = item.location.city;

            var loca = item.id; // can't use location-- JavaScript keyword
            var dateObj = new Date(); // create an object holding todays date
            var month = dateObj.getMonth() + 1;
            var day = dateObj.getDate();
            var year = dateObj.getFullYear();
            var todayDate = year + "/" + month + "/" + day;


            //See if anyone is already going to this loca today
            //Move this to run first, once database has been checked and tempObj.going is assigned, then build the rest of the object
            Going.findOne({
              loc: loca,
              date: todayDate
            }, function(err, data) {
              if (err) throw err;
              if (data) {

                tempObj.going = data.going.length;
                if (tempObj.going != 0) { // If there are users going, check if logged in user is one of them
                  var checkForUser = data.going;

                  function findUser(user) {
                    return user === req.session.userID;
                  }

                  var userFound = checkForUser.find(findUser);
                  console.log("userFound = " + userFound);
                  if (userFound != undefined) { // if user is found in this record, change tempObj.userFound to true
                    tempObj.userFound = true;
                  }
                }
                itemsArr.push(tempObj);
                callback();
              } else {
                tempObj.going = "0";
                itemsArr.push(tempObj);
                callback();
              }

            });

          },
          function(err) {
            console.log(err);
            itemsArr.sort(function(a, b) {
              var locA = a.name.toUpperCase();
              var locB = b.name.toUpperCase();
              return (locA < locB) ? -1 : (locA > locB) ? 1 : 0;
            });


            res.render('index', {
              userID: req.session.username,
              searchTerm: req.session.searchTerm,
              itemsArr: itemsArr,
            });


          });



      });
  } else {


    res.render('index', {
      userID: req.session.username,
      searchTerm: "undefined",
      itemsArr: [],
    });
  }
});


app.get('/logout', function(req, res, next) { //Logout the user
  console.log("logging out...");
  req.session.destroy(); //deletes current session information

  res.redirect('/');
});

app.post('/', function(req, res) {
  if (req.body.searchTerm != undefined) {

    req.session.searchTerm = req.body.searchTerm; // This may be what causes empty search crash
  } else if (req.body.going != undefined) {
    var tempUser = [];
    tempUser.going = req.session.userID;
    tempUser.loc = req.body.going;
    var loca = req.body.going;

    var dateObj = new Date(); // create an object holding todays date in format year/month/day
    var month = dateObj.getMonth() + 1;
    var day = dateObj.getDate();
    var year = dateObj.getFullYear();
    var todayDate = year + "/" + month + "/" + day;

    Going.findOne({
      loc: loca,
      date: todayDate
    }, function(err, data) {
      console.log(err);
      if (data) {

        var userGoing = false; //check if current user is already in db for this business/date
        for (var i = 0; i < data.going.length; i++) {
          if (tempUser.going === data.going[i]) {

            userGoing = true;
            var temp = req.session.userID;

            Going.findOneAndUpdate({
              loc: loca,
              date: todayDate
            }, {
              $pull: {
                'going': temp
              }
            }, function(err, data) { // pull removes item from array. works if id is typed in as string
              console.log(err, data);
            });

          }

        }
        if (userGoing === false) {
          Going.findByIdAndUpdate(
            data.id, {
              $push: {
                "going": req.session.userID
              }
            },
            function(err, data) {
              console.log(err);
            }
          )
        }

      } else {
        console.log("record not found");
        var dateObj = new Date();
        var month = dateObj.getMonth() + 1;
        var day = dateObj.getDate();
        var year = dateObj.getFullYear();
        var newDate = year + "/" + month + "/" + day;
        var currentLocation = new Going({
          loc: req.body.going,
          going: req.session.userID,
          date: newDate
        });
        currentLocation.save(function(err) {
          if (err) throw err;
          console.log("save successful");
        })

      }
    });


  }
  res.redirect('/');
});

app.listen(port, function() {
  console.log("Node.js is listening on port " + port + "...");
});
