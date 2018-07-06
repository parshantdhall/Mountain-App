var express               = require("express"),
    app                   = express(),
    bodyParser            = require("body-parser"),
    methodOverride        = require("method-override"),
    passport              = require("passport"),
    localStrategy         = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    expressSession        = require("express-session"),
    mongoose              = require("mongoose");
    
    //Importing the models
    var User = require("./models/user");
    var Logo = require("./models/logo");

    //App configuration
    app.set("view engine", "ejs");
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(express.static(__dirname + "/public"));
    app.use(methodOverride("_method"));

    mongoose.connect("mongodb://localhost:27017/mountain_cms", { useNewUrlParser: true }, function(err) {
        if(err) {
            console.log(err);
        }else {
            console.log("==========Mountain_cms DataBase Connected=========");
        }
    });

    //Setting Up the Authorization
    app.use(expressSession({
        secret: "Dhall",
        resave: false,
        saveUninitialized: false
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());
    passport.use(new localStrategy(User.authenticate()));

    app.use(function(req, res, next) {
        res.locals.currentUser = req.user;
        next();
    });

    //Importing the Routes
    var index_route = require("./routes/index_route"),
        edit_route  = require("./routes/edit_routes"),
        auth_route  = require("./routes/auth_routes");

    //Using the Routes
    app.use(index_route);
    app.use(edit_route);
    app.use(auth_route);



    //App End Configurations
    app.get("*", function(req, res) {
        res.send("OOPS Page not Found Tatti Khaoo!");
    });
    app.listen(3000, function () { 
        console.log("-------Server Started at localhost:3000-------");
     });