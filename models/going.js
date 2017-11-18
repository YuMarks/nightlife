var mongoose = require("mongoose");  //use to connect to MongoDB
//var Schema = mongoose.Schema;

var userSchema = mongoose.Schema({
    username: { type: String, unique: true },
    goingTo: { type: String, unique: true }
});

var goingSchema = mongoose.Schema({
    loc: { type: String },
    going: [{ default: 0, type: String, default: true }],
    date: { type: Object, default: Date.now() }
});



var User = mongoose.model("User", userSchema);
var Going = mongoose.model("Going", goingSchema);

module.exports = User;
module.exports = Going;