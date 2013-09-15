/*
 * GET home page.
 */
var needle = require('needle');
var util = require('util');
//var Buffer = require('buffer');
exports.index = function (req, res) {
    res.render('index', {
        title: 'Express',
        isLogin: req.session.isLogin,
        code: req.session.idClient ? req.session.idClient : ''
    });
};

exports.getJade = function (req, res) {
    res.render(req.params.name);
};

exports.loged = function (req, res) {
    //console.log(req);
    req.session.code = req.query.code;
    var finalUrl = 'https://api.mercadolibre.com/oauth/token'

    needle.post(finalUrl,
        {
            grant_type: 'authorization_code',
            client_id: '4416176012263899',
            client_secret: 'ZB0IaYm6BxVHsX2OE1RkqExvCu0VZC0F',
            code: req.session.code,
            redirect_uri: 'http://santi8ago8.kd.io:8080/login'
        },
        {
            secureProtocol: "SSLv3_method"
        },
        function (a, b, c) {
            //console.log(b.body);
            if (b.body.access_token) {
                req.session.code = req.query.code;
                req.session.isLogin = true;
                req.session.access_token = b.body.access_token;
            }
            needle.get('https://api.mercadolibre.com/users/me?access_token=' + req.session.access_token, {
                secureProtocol: "SSLv3_method"
            }, function (err, r) {
                req.session.idClient = r.body.id;
                console.log(r.body.id);
                res.redirect('/');

            });
        }
    );
};


exports.notif = function (req, res) {
    res.json({});

    console.log(req.body);


    if (req.body.topic == 'item') {
        sendEvent(req, 'item');
    }
    if (req.body.topic == 'orders') {
        sendEvent(req, 'orders');
    }
    if (req.body.topic == 'questions') {
        sendEvent(req, 'questions');
    }


};


function sendEvent(req, eventName) {
    var socketToSend;
    io.sockets.clients().forEach(function (socket) {
        if (req.session.idClient == socket.idClient && socket.idClient) {
            socketToSend = socket
            var url = "https://api.mercadolibre.com/%s?access_token=%s"
            var finalUrl = util.format(url, req.body.resource, req.session.access_token);
            needle.get(finalUrl, {
                secureProtocol: "SSLv3_method"
            }, function (err, r) {

                if (socketToSend) {
                    socketToSend.emit(eventName, r.body);
                }

            });

        }
    });
}


var io = require('socket.io').listen(80801);

io.sockets.on('connection', function (socket) {
    socket.on('logged', function (data) {
        socket.idClient = data.idClient;
    });
});