var User = require("../models/user");

var middlewareObj = {}
middlewareObj.isLoggedIn = function (req, res, next) {
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "Please Log In First");
    res.redirect("/login");
}

middlewareObj.isNotValid = function(req, res, next) {
    //First of all we will match the username and find it from the database and then check if the user is valid or not
    //Matching the username with findOne function
    User.findOne({username: req.body.username}, function(err, user){
            if(err) {
                req.flash("error", "Invalid User")
                return res.redirect("back");
            }
            else if(user.active === true){
                return next();
            }
            else {
                req.flash("error", "Please verify your email first");
                res.redirect("back");
            }
    });    
}
module.exports = middlewareObj;