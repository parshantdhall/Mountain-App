    /*---------Authentication Routes-------------*/
    var express      = require("express"),
        router       = express.Router(),
        passport     = require("passport"),
        middleware = require("../middleware/middleware"),
        async        = require("async"),
        nodemailer   = require("nodemailer"),
        crypto       = require("crypto"),
        randomString = require("randomstring");
    //Importing the models
    var User = require("../models/user"); 

    //Setting Up the sign Up
    router.get("/register", function(req, res) {
        res.render("register");
    });

    router.post("/register", function (req, res) {
        var username = req.body.username,
            password = req.body.password,
            email    = req.body.email;
            var secretToken = randomString.generate();
            //If the user with that same email already exists and it will show error...
            User.findOne({ email: email }, function(err, user){
                if(!user){
                  User.register(new User({username: username, email: email, secretToken: secretToken}), password, function(err, user) {
                    if(err) {
                        console.log(err);
                        req.flash("error", err.message); //Same Username Error
                        res.redirect("/register");
                    }else {
                        //======Sending the Confirmation Email====
                        var smtpTransport = nodemailer.createTransport({
                          host: 'mail.smtp2go.com',
                          port: 2525,
                          secure: false, 
                          auth: {
                                user: process.env.USR, 
                                pass: process.env.PSWD 
                            }
                        });
                        var mailOptions = {
                          to: user.email,
                          from: 'me@parshantdhall.cf',
                          subject: 'Mountain APP Email Verification',
                          text: 'You are receiving this because you (or someone else) have requested the Email verification for your account.\n\n' +
                            'Please click on the following link, or paste this into your browser and also paste the secret token in the input field to complete the process:\n\n' +
                            'http://' + req.headers.host + '/verify/' + user.username + '\n\n' +
                            'Secret Token is = ' + user.secretToken + '\n\n' +
                            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                        };
                        smtpTransport.sendMail(mailOptions, function(err) {
                          if(err) {
                            console.log(err);
                          }
                          console.log('mail sent');
                          req.flash('success', 'Account created successfully and an e-mail has been sent to ' + user.email + ' with further instructions.');
                          res.redirect("/register");
                        });
                    }
                });
               }
                else {
                  req.flash("error", "Account With that email is already exists");
                  res.redirect("back");
                }
            });
      });

      //Setting the sign In Routing
      router.get("/login", function(req, res) {
        res.render("login");
      });

      router.post("/login", middleware.isNotValid, passport.authenticate("local",{
          successRedirect: "/",
          failureRedirect: "/login"
      }) ,function(req, res) {});

      //Setting the Sign Out 
      router.get("/logout", function(req, res) {
          req.logout();
          req.flash("success", "Successfully Logged You Out!");
          res.redirect("/");
      });

      /* =========Verifying the email Configuration======= */

      router.get("/verify/:username", function(req, res) {
        User.findOne({username: req.params.username}, function(err, userFound) {
          if(err) {
            console.log(err);
          }else {
            res.render("verify", {userFound: userFound});
          }
        });
      });

      router.put("/verify/:username", function(req, res) {
        //Finding the user from params and match the secret token
          User.findOne({username: req.params.username} ,function(err, user) {
            if(!user && err) {
              req.flash("error", "User Not Found");
              res.redirect("back");
            }else if(user.secretToken === req.body.secretToken){ 
              User.update({username: req.params.username}, {$set:{active: true}}, function(err, userUpdated){
                if(err) {
                  console.log(err);
                }else {
                  req.flash("sucess", "Email Confirmed Now you May login");
                  res.redirect("/login");
                }
              });            
            }
            else {
              req.flash("error", "Incorrect Secret Token");
              res.redirect("back");
            }
          });
      });

      /* =========Verifying the email Configuration========== */
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
                  req.flash("error",'No account with that email address exists.');
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
                host: 'mail.smtp2go.com',
                port: 2525,
                secure: false, // true for 465, false for other ports
                auth: {
                      user: process.env.USR, 
                      pass: process.env.PSWD 
                  }
              });
              var mailOptions = {
                to: user.email,
                from: 'me@parshantdhall.cf',
                subject: 'Node.js Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                  'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                  'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                  'If you did not request this, please ignore this email and your password will remain unchanged.\n'
              };
              smtpTransport.sendMail(mailOptions, function(err) {
                console.log('mail sent');
                req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
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
              req.flash('error', 'Password reset token is invalid or has expired.');
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
                  req.flash('error', 'Password reset token is invalid or has expired.');
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
                    req.flash("error", "Passwords do not match.");
                    return res.redirect('back');
                }
              });
            },
            function(user, done) {
              var smtpTransport = nodemailer.createTransport({
                host: 'mail.smtp2go.com',
                port: 2525,
                secure: false, // true for 465, false for other ports
                auth: {
                      user: process.env.USR, 
                      pass: process.env.PSWD 
                  }
              });
              var mailOptions = {
                to: user.email,
                from: 'me@parshantdhall.cf',
                subject: 'Your password has been changed',
                text: 'Hello,\n\n' +
                  'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
              };
              smtpTransport.sendMail(mailOptions, function(err) {
                req.flash('success', 'Success! Your password has been changed.');
                done(err);
              });
            }
          ], function(err) {
            res.redirect('/');
          });
        });
        
      module.exports = router;