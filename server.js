var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var mongoose    = require('mongoose');
var Profile     = require('./profile');

var config = {
    "secrets" : {
        'clientId' : 'IAFEM1FEVX1WFUWPRA5K4TKWLVCOSMPNXO4G1HWKWTYIX4E0',
        'clientSecret' : 'E0MFGQOQQQ3SRE0BXQ2FMH4XTESMNCHBT52CXEFPJ3DAYUGR',
        'redirectUrl' : 'http://localhost:9000/callback'
    }
};
var Foursquare  = require("node-foursquare")(config);

var dbHost      = 'localhost';
var dbPort      = '27017';
var dbName      = 'habbits';

mongoose.connect('mongodb://'+dbHost+':'+dbPort+'/'+dbName);
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

var port = process.env.PORT || 9000;        // set our port
var router = express.Router();              // get an instance of the express Router

router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });
});

router.get('/login', function(req, res) {
  res.writeHead(303, { "location": Foursquare.getAuthClientRedirectUrl() });
  res.end();
});

app.get('/callback', function (req, res) {
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

                profile = new Profile();      // create a new instance of the Profile model
                profile.foursquareId = req.body.id;
                profile.personalInfo.firstName = req.body.firstName || '';
                profile.personalInfo.lastName = req.body.lastName || '';
                profile.personalInfo.gender = req.body.gender || '';
                profile.personalInfo.picture = req.body.photo.prefix + 'width300' + req.body.photo.suffix;
                profile.personalInfo.relationship = req.body.relationship || '';
                profile.personalInfo.url = req.body.url || '';
                profile.personalInfo.bio = req.body.bio || '';
                profile.personalInfo.email = req.body.contact.email || '';
                profile.personalInfo.checkins.count = req.body.checkins.count || 0;
                profile.friends = req.body.friends.count || '';
                profile.tips = req.body.tips.count || '';
                profile.currentCity = req.body.homeCity || '';
                profile.superuser = req.body.superuser || '';
                profile.type = req.body.type || '';
                profile.mayorships = req.body.mayorships.count || 0;
                profile.createdAt = req.body.createdAt || '';

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
                profile.checkins = req.body.data;
                profile.save(function(err) {
                    if (err)
                        res.send(err);

                    res.json({ status: '200', message: 'Profile created'});
                });
            } else {
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


app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
