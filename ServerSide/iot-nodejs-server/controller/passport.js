var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    var user = {
        id: 1,
        username: 'lane',
        password: 'raspberryPi'
    };

    done(null, user);
});

passport.use(new LocalStrategy(
    function(username, password, done) {
        var user = {
            id: 1,
            username: 'lane',
            password: 'raspberryPi'
        };

        if (username !== user.username) {
            return done(null, false, { message: 'Incorrect username.' });
        }
        if (password !== user.password) {
            return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
    }
));
