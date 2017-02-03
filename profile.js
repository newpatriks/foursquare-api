var mongoose    = require('mongoose');
var Schema      = mongoose.Schema;

var ProfileSchema   = new Schema({
    personalInfo: {
        firstName: String,
        lastName: String,
        gender: String,
        picture: String,
        relationship: String,
        url: String,
        bio: String,
        email: String,
        checkins: {
            count: String
        }
    },
    foursquareId: String,
    friends: String,
    currentCity: String,
    superuser: String,
    type: String,
    mayorships: String,
    createdAt: String,
    tips: String,
    checkins: Object
});
module.exports = mongoose.model('Profile', ProfileSchema);
