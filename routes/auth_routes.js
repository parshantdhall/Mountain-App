    /*---------Authentication Routes-------------*/
    var express    = require("express"),
        router     = express.Router(),
        passport   = require("passport"),
        async      = require("async"),
        nodemailer = require("nodemailer"),
        crypto     = require("crypto");
    //Importing the models
    var User = require("../models/user"); 
    var Logo = require("../models/logo");

    // Setting Up the sign Up
    router.get("/register", function(req, res) {
        res.render("register");
    });

    router.post("/register", function (req, res) {
        var username = req.body.username,
            password = req.body.password,
            email    = req.body.email;
            User.register(new User({username: username, email: email}), password, function(err, user) {
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

      //Forgot Password Configurations-------
      router.get("/forgot", function(req, res) {
          res.render("forgot");
      });

      router.post("/forgot", function(req, res, next) {
        async.waterfall([
            function(done) {
              crypto.randomBytes(20, function(err, buf) {
                var token = buf.toString('hex');
                done(err, token);
              });
            },
            function(token, done) {
              User.findOne({ email: req.body.email }, function(err, user) {
                if (!user) {
                  console.log('error', 'No account with that email address exists.');
                  return res.redirect('/forgot');
                }
        
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        
                user.save(function(err) {
                  done(err, token, user);
                });
              });
            },
            function(token, user, done) {
              var smtpTransport = nodemailer.createTransport({
                service: 'Gmail', 
                auth: {
                  user: 'Your Email',
                  pass: ''//Password
                }
              });
              var mailOptions = {
                to: user.email,
                from: 'Your Email',
                subject: 'Node.js Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                  'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                  'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                  'If you did not request this, please ignore this email and your password will remain unchanged.\n'
              };
              smtpTransport.sendMail(mailOptions, function(err) {
                console.log('mail sent');
                console.log('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                done(err, 'done');
              });
            }
          ], function(err) {
            if (err) return next(err);
            res.redirect('/forgot');
          });
        });
        //Another part of Forgot Password 
        
        router.get('/reset/:token', function(req, res) {
          User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
            if (!user) {
              console.log('error', 'Password reset token is invalid or has expired.');
              return res.redirect('/forgot');
            }
            res.render('reset', {token: req.params.token});
          });
        });
        
        router.post('/reset/:token', function(req, res) {
          async.waterfall([
            function(done) {
              User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
                if (!user) {
                  console.log('error', 'Password reset token is invalid or has expired.');
                  return res.redirect('back');
                }
                if(req.body.password === req.body.confirm) {
                  user.setPassword(req.body.password, function(err) {
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;
        
                    user.save(function(err) {
                      req.logIn(user, function(err) {
                        done(err, user);
                      });
                    });
                  })
                } else {
                    console.log("error", "Passwords do not match.");
                    return res.redirect('back');
                }
              });
            },
            function(user, done) {
              var smtpTransport = nodemailer.createTransport({
                service: 'Gmail', 
                auth: {
                  user: 'Your Email',
                  pass: '' //Password
                }
              });
              var mailOptions = {
                to: user.email,
                from: 'Your Email',
                subject: 'Your password has been changed',
                text: 'Hello,\n\n' +
                  'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
              };
              smtpTransport.sendMail(mailOptions, function(err) {
                console.log('success', 'Success! Your password has been changed.');
                done(err);
              });
            }
          ], function(err) {
            res.redirect('/');
          });
        });
        
      module.exports = router;