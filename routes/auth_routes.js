    /*---------Authentication Routes-------------*/
    var express = require("express"),
        router  = express.Router(),
        passport = require("passport");

    //Importing the models
    var User = require("../models/user");
    var Logo = require("../models/logo");

    // Setting Up the sign Up
    router.get("/register", function(req, res) {
        res.render("register");
    });

    router.post("/register", function (req, res) {
        var username = req.body.username,
            password = req.body.password;
            User.register(new User({username: username}), password, function(err, user) {
                if(err) {
                    console.log(err);
                    res.redirect("/register");
                }else {
                    passport.authenticate("local")(req, res, function() {
                        res.redirect("/");
                    });
                }
            });
      });

      //Setting the sign In Routing
      router.get("/login", function(req, res) {
        res.render("login");
      });

      router.post("/login", passport.authenticate("local", {
          successRedirect: "/",
          failureRedirect: "/login"
      }) ,function(req, res) {});

      //Setting the Sign Out 
      router.get("/logout", function(req, res) {
          req.logout();
          res.redirect("/");
      });
      
      module.exports = router;