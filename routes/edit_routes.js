//Edit Route
var express = require("express"),
    router  = express.Router();

    //Importing the models
    var User = require("../models/user");
    var Logo = require("../models/logo");

            //Requirung MiddleWare
    var middleware = require("../middleware/middleware");

    
router.get("/:id/editlogo", middleware.isLoggedIn, function(req, res) {
    Logo.findById(req.params.id, function(err, logoEdit) {
        res.render("editLogo", {logoEdit: logoEdit});
    });
});

router.put("/:id/editlogo", middleware.isLoggedIn, function(req, res) {
    Logo.findByIdAndUpdate(req.params.id, {name: req.body.logoName}, function(err, updatedLogo) {
        if(err) {
            console.log(err);
        }else {
            // console.log("Logo updated = " + updatedLogo);
            res.redirect("/");
        }
    });
});


module.exports = router;