var mongoose    = require('mongoose');
var Schema      = mongoose.Schema;

var ProfileSchema = new Schema({
    personalInfo: {
        firstName: String,
        lastName: String,
        picture: String,
        checkins: {
            count: String
        },
        createdAt: Number,
        relationship: String,
        url: String,
        bio: String,
        email: String,
        gender: String,
        superuser: String,
        mayorships: String,
        currentCity: String,
        tips: String,
        contact: Object,
        friends: {
            count: String,
            items: Object
        },
        photos: {
            count: String,
            items: Object
        },
        lists: {
            count: String,
            items: Object
        },
    },
    foursquareId: String,
    checkins: Object
});

module.exports = mongoose.model('Profile', ProfileSchema);
