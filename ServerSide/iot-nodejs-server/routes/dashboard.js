var express = require('express');
var router = express.Router();

/* GET dashboard page. */

router.get('/logout', isLoggedIn, function (req, res, next) {
    req.logout();
    res.redirect('/');
});

router.get('/', isLoggedIn, function (req, res, next) {
    res.render('dashboard')
});

module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}
