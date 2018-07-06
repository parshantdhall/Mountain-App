var express = require("express"),
    router  = express.Router();

    var Logo = require("../models/logo");

router.get("/", function(req, res) {
    Logo.find({}, function(err, logoFound) {
        if(err){
            console.log(err);
        }else {
            res.render("index", {logoFound: logoFound});
        }
    });
});

module.exports = router;