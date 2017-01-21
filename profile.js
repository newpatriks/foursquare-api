var mongoose    = require('mongoose');
var Schema      = mongoose.Schema;

var ProfileSchema   = new Schema({
    id: String,
    name: String,
    music: Object,
    books: Object,
    movies: Object,
    television: Object
});

module.exports = mongoose.model('Profile', ProfileSchema);
