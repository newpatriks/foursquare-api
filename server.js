var express     = require('express');
var util        = require('util');
var app         = express();
var bodyParser  = require('body-parser');
var mongoose    = require('mongoose');
var Profile     = require('./profile');
var port        = process.env.PORT || 9000;
var router      = express.Router();

var config = {
    "secrets" : {
        'clientId' : process.env.CLIENT_ID,
        'clientSecret' : process.env.CLIENT_SECRET,
        'redirectUrl' : process.env.REDIRECT_URL
        // 'redirectUrl' : 'http://localhost:9000/api/callback'
    }
};

console.log(config);

// console.log(config);
var Foursquare  = require("node-foursquare")(config);

console.log('process.env.MONGODB_URI >> ', process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongoose > connection error:'));
db.once('open', function() {
    console.log('mongoose > connection successful!');
});


app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });
});

router.get('/login', function(req, res) {
  res.writeHead(303, { "location": Foursquare.getAuthClientRedirectUrl() });
  res.end();
});

router.get('/callback', function (req, res) {
    Foursquare.getAccessToken({
        code: req.query.code
    }, function (error, accessToken) {
        if(error) {
            res.send("An error was thrown: " + error.message);
        }
        else {
            // Save the accessToken and redirect.
            console.log('accessToken >> ', accessToken);
            var baseURL = "http://localhost:8080/app/#/callback/";
            res.writeHead(302, {
                'Location': baseURL+accessToken
            });
            res.end();
        }
    });
});

router.route('/profile')
    .post(function(req, res) {
        Profile.findOne({foursquareId: req.body.id}, function(err, profile) {
            if (!profile) {

                profile = new Profile();
                profile.foursquareId = req.body.id;
                profile.personalInfo.firstName = req.body.firstName || '';
                profile.personalInfo.lastName = req.body.lastName || '';
                profile.personalInfo.picture = req.body.photo.prefix + 'width300' + req.body.photo.suffix;
                profile.personalInfo.checkins.count = req.body.checkins.count || 0;
                profile.personalInfo.createdAt = req.body.createdAt || 0;
                profile.personalInfo.friends.count = req.body.friends.count || '';
                profile.personalInfo.friends.items = req.body.friends.groups;
                profile.personalInfo.photos.count = req.body.photos.count || '';
                profile.personalInfo.photos.items = req.body.photos.items;
                profile.personalInfo.lists.count = req.body.lists.count || '';
                profile.personalInfo.lists.items = req.body.lists.groups;
                profile.personalInfo.gender = req.body.gender || '';
                profile.personalInfo.relationship = req.body.relationship || '';
                profile.personalInfo.url = req.body.url || '';
                profile.personalInfo.bio = req.body.bio || '';
                profile.personalInfo.email = req.body.contact.email || '';
                profile.personalInfo.tips = req.body.tips.count || '';
                profile.personalInfo.contact = req.body.contact || '';
                profile.personalInfo.currentCity = req.body.homeCity || '';
                profile.personalInfo.superuser = req.body.superuser || '';
                profile.personalInfo.mayorships = req.body.mayorships.count || 0;

                profile.save(function(err) {
                    if (err)
                        res.send(err);

                    res.json({ status: '200', message: 'Profile created!', data: profile.foursquareId });
                });
            } else {
                res.json({ status: '200', message: 'This user already exist!', data: profile });
            }
        });
    });

router.route('/checkins')
    .post(function(req, res) {
        Profile.findOne({foursquareId: req.body.id}, function(err, profile) {

            if (!profile) {
                profile = new Profile();      // create a new instance of the Profile model
                profile.foursquareId = req.body.id;

                // parse checkins
                var checkinList = req.body.data.map(function(checkin) {
                    checkin.date = new Date(parseInt(checkin.createdAt) * 1000);
                    console.log(checkin);
                });

                profile.checkins = checkinList;

                profile.save(function(err) {
                    if (err)
                        res.send(err);

                    res.json({ status: '200', message: 'Profile created'});
                });
            } else {
                // parse checkins
                req.body.data.forEach(function(checkin) {
                    checkin.date = new Date(parseInt(checkin.createdAt) * 1000);
                });
                profile.update({checkins: req.body.data}, function(err) {
                    if (err)
                        res.send(err);

                    res.json({ status: '200', message: 'Profile updated'});
                });
            }
        });
    });

router.route('/user/:id')
    .get(function(req, res) {
        Profile.findOne({foursquareId: req.params.id}, function(err, profile) {
            if (!profile) {
                res.json({ status: '200', message: 'Profile not found', data: null});
            } else {
                res.json({ status: '200', message: 'Profile found', data: profile.personalInfo});
            }
        });
    });

router.route('/user-checkins/:id')
    .get(function(req, res) {
        Profile.findOne({foursquareId: req.params.id}, function(err, profile) {
            if (!profile) {
                res.json({ status: '200', message: 'Profile not found', data: null});
            } else {

                res.json({ status: '200', message: 'Profile found', data: profile.checkins});
            }
        });
    });

var setDate = function(id, res) {
    Profile.aggregate([
        { $match: {
            foursquareId: id
        }},
        { $unwind: '$checkins'},
        { $project : {
            year: { $year: "$checkins.date"},
            month: { $month: "$checkins.date"}
        }},
        { $group: {_id :{year:"$year", month:"$month"}, count:{ $sum:1}}},
        { $group: {_id :{year:"$_id.year"}, months: { $push:  { month: "$_id.month", count: "$count" } }}}
    ], {}, function(err, result) {
        if (err) {
            return err;
        }

        Profile.update({historySimple: result}, function(err) {
            if (err)
                res.send(err)

            res.json({ status: '200', message: 'Profile found', data: result});
        });
    });
}

var updateProfile = function(id, callback, res) {
    Profile.findOne({foursquareId: id}, function(err, profile) {
        if (profile) {
            return callback(profile.foursquareId, res);
        }
    });
}

router.route('/history/:id')
    .get(function(req, res) {
        updateProfile(req.params.id, setDate, res);
    });

app.use('/api', router);
app.listen(port, function () {
  console.log('Magic happens on port ' + port)
});
