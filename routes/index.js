/*
 * GET home page.
 */
var needle = require('needle');
var util = require('util');
//var Buffer = require('buffer');
exports.index = function (req, res) {
    //console.log(req);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
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

    console.log("new Notification: " + req.body.resource);
    if (req.body.topic == 'orders') {
        sendEvent(req, 'orders');
    }
    if (req.body.topic == 'questions') {
        sendEvent(req, 'questions');
    }


};


function sendEvent(req, eventName) {
    console.log('sendig event', eventName);


    var token;
    var ss = req.sessionStore.sessions;
    for (var s in ss) {
        var sd = JSON.parse(ss[s]);
        if (req.body.user_id == sd.idClient)
            token = sd.access_token;
    }
    var url = "https://api.mercadolibre.com%s?access_token=%s"
    var finalUrl = util.format(url, req.body.resource, token);

    needle.get(finalUrl, {
        secureProtocol: "SSLv3_method"
    }, function (err, r) {
        var userID;
        if (eventName == 'questions')
            userID = r.body.from.id;
        if (eventName == 'orders')
            userID = r.body.buyer.id;

        var itemID;
        if (eventName == 'questions')
            itemID = r.body.item_id;
        if (eventName == 'orders')
            itemID = r.body.order_items[0].item.id;


        var data = r.body;
        console.log(data);
        needle.get("https://api.mercadolibre.com/items/" + itemID, {secureProtocol: "SSLv3_method"},
            function (err, rItem) {
                data.item = rItem.body;
                console.log(data);
                needle.get("https://api.mercadolibre.com/users/" + userID, {secureProtocol: "SSLv3_method"},
                    function (err, rUser) {
                        data.user = rUser.body;
                        console.log(data);
                        io.sockets.in(r.body.user_id).emit(eventName, data);
                    }
                );
            }
        );


    });

}

exports.test = function (a, b) {
    io.sockets.emit('test', Math.random());
};

var io = require('socket.io').listen(8081, {log: false});

io.sockets.on('connection', function (socket) {
    socket.on('logged', function (data) {
        socket.idClient = data.idClient;
    });
    socket.on('room', function (room) {
        socket.join(room);
    });
});