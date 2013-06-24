
/*
 * GET home page.
 */

exports.index = function(req, res) {
    res.render('index', { user: req.user, isAuthenticated: req.isAuthenticated() });
};

exports.login = function(req, res) {
    res.render('login');
};

exports.loginSuccess = function(req, res) {
    res.redirect('/');
};

exports.logout = function(req, res) {
    req.logout();
    res.redirect('/');
};

exports.beta = function (req, res) {
    res.render('beta', { user: req.user, isAuthenticated: req.isAuthenticated() });
}

exports.addCommonResponseHeaders = function (req, res, next) {
    res.set('Cache-Control', 'no-cache');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Origin', '*');
    next();
};