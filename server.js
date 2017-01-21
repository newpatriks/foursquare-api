var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var mongoose    = require('mongoose');
var Profile     = require('./profile');

var config = {
    "secrets" : {
        'clientId' : 'IAFEM1FEVX1WFUWPRA5K4TKWLVCOSMPNXO4G1HWKWTYIX4E0',
        'clientSecret' : 'E0MFGQOQQQ3SRE0BXQ2FMH4XTESMNCHBT52CXEFPJ3DAYUGR',
        'redirectUrl' : 'http://localhost:8080/' // This should also be set in your OAuth profile.
    }
};
var foursquare  = require("node-foursquare")(config);

var dbHost      = 'localhost';
var dbPort      = '27017';
var dbName      = 'socialpatterns';

mongoose.connect('mongodb://'+dbHost+':'+dbPort+'/'+dbName);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongoose > connection error:'));
db.once('open', function() {
    console.log('mongoose > connection successful!');
});


// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
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
        }
    });
});

router.route('/profile')
    .post(function(req, res) {
        Profile.findOne({id: req.body.id}, function(err, profile) {
            if (!profile) {

                profile = new Profile();      // create a new instance of the Profile model
                profile.id = req.body.id;
                profile.name = req.body.name;
                // profile.music = req.body.music;
                // profile.books = req.body.books;
                // profile.movies = req.body.movies;
                // profile.television = req.body.television;

                profile.save(function(err) {
                    if (err)
                        res.send(err);

                    res.json({ status: '200', message: 'Profile created!', data: profile.id });
                });
            } else {
                profile.update(
                    {id: req.body.id},
                    // {music: req.body.music, books: req.body.books, movies: req.body.movies, television: req.body.television},
                    function(err) {
                        if (err)
                            res.send(err);

                        res.json({ status: '200', message: 'Profile updated!', data: profile.id });
                    }
                );
            }
        });

    })

    .get(function(req, res) {
        console.log('GET!');
        Profile.find(function(err, profile) {
            if (err)
                res.send(err);

            res.json(profile);
        });
    });

router.route('/profile/:profileId').get(function(req, res) {
    Profile.findOne({id: req.params.profileId}, function(err, profile) {
        if (err)
            res.send(err);

        res.json(profile);
    });
});


app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
