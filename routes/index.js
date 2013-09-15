/*
 * GET home page.
 */
var needle = require('needle');
exports.index = function (req, res) {
    res.render('index', {
        title: 'Express',
        isLogin: req.session.isLogin,
        code: req.session.code ? req.session.code : 'codigo'
    });

};

exports.loged = function (req, res) {
    req.session.code = req.query.code;
    req.session.isLogin = true;
    res.redirect('/');

};

exports.getJade = function (req, res) {
    res.render(req.params.name);
};
