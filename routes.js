var express = require("express");
var router = express.Router();
var User = require("./models/going");

router.use(function(req, res, next){
   console.log("found routes");
   res.locals.currentUser = req.user;
   next();
});

router.post('/', function(req, res){   // home page route
   if(req.body.searchTerm != undefined){
   console.log(req.body);
   req.session.searchTerm = req.body.searchTerm;
   } else if(req.body.going != undefined){
       console.log(req.body);
       
   }
   res.redirect('/');
});

router.get('profile', function(req, res){
   res.render('profile',
        {userID: req.session.userID
        });
});

module.exports = router;