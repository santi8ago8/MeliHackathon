/*
 * GET home page.
 * Perdon el desorden estaba apurado
 * Santiago N. Córdoba
 */
var needle = require('needle');
var util = require('util');

//render pagina de inicio
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

//renderiza un archivo jade y lo envia /jade/:namefile
exports.getJade = function (req, res) {
    res.render(req.params.name);
};

// redirección de oauth
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

//recibir las notificaciones desde Meli
exports.notif = function (req, res) {
    res.json({});

    console.log("new Notification: " + req.body.resource);
    if (req.body.topic == 'orders') {
        sendEvent(req, 'orders');
        console.log(req.body);
    }
    if (req.body.topic == 'questions') {
        sendEvent(req, 'questions');
    }


};

//envia evento por medio de sockets a el cliente que tiene que recibirlo.
function sendEvent(req, eventName) {
    console.log('sendig event', eventName);

    var data = req.body;
    var token;
    var ss = req.sessionStore.sessions;
    for (var s in ss) {
        var sd = JSON.parse(ss[s]);
        if (req.body.user_id == sd.idClient)
            token = sd.access_token;
    }
    var url = "https://api.mercadolibre.com%s?access_token=%s"
    var finalUrl = util.format(url, req.body.resource, token);
    console.log(finalUrl);
    if (token) {
        needle.get(finalUrl, {
            secureProtocol: "SSLv3_method"
        }, function (err, r) {

            var userID;
            if (eventName == 'questions') {
                userID = r.body.from.id;
            }
            if (eventName == 'orders') {
                userID = r.body.buyer.id;
            }

            var itemID;
            if (eventName == 'questions')
                itemID = r.body.item_id;
            if (eventName == 'orders')
                itemID = r.body.order_items[0].item.id;

            data.info = r.body;

            // console.log(data);
            needle.get("https://api.mercadolibre.com/items/" + itemID, {secureProtocol: "SSLv3_method"},
                function (err, rItem) {
                    data.item = rItem.body;
                    // console.log(data);
                    needle.get("https://api.mercadolibre.com/users/" + userID, {secureProtocol: "SSLv3_method"},
                        function (err, rUser) {
                            data.user = rUser.body;
                            //  console.log(data);
                            io.sockets.in(data.user_id).emit(eventName, data);
                        }
                    );
                }
            );


        });
    }

}


//test method
exports.test = function (a, b) {
    io.sockets.emit('test', Math.random());
};

//init socket.io
var io = require('socket.io').listen(8081, {log: false});

//principal event socket.io
io.sockets.on('connection', function (socket) {
    socket.on('logged', function (data) {
        //  socket.idClient = data.idClient;
    });
    socket.on('room', function (room) {
        socket.join(room);
    });
});

//busca todas las preguntas
exports.getAllQuest = function (req, res) {
    needle.get(
        "https://api.mercadolibre.com/my/received_questions/search?access_token=" + req.session.access_token,
        {secureProtocol: "SSLv3_method"},
        function (err, r) {
            var ret = [];
            var users = [];
            var items = [];
            for (var i = 0; i < r.body.questions.length; i++) {
                var obj = r.body.questions[i];
                if (obj.status == 'UNANSWERED') {
                    ret.push({info: obj, user: undefined, item: undefined});
                    if (users.indexOf(obj.from.id) == -1)
                        users.push(obj.from.id);
                    if (items.indexOf(obj.item_id) == -1)
                        items.push(obj.item_id);
                }


            }
            //get users data

            needle.get('https://api.mercadolibre.com/users/' + users.join(),
                {secureProtocol: "SSLv3_method"},
                function (err, rUs) {

                    if (!Array.isArray(rUs.body))
                        rUs.body = [rUs.body];
                    for (var i = 0; i < rUs.body.length; i++) {
                        var us = rUs.body[i];
                        for (var j = 0; j < ret.length; j++) {
                            var objRet = ret[j];
                            if (objRet.info.from.id == us.id)
                                ret[j].user = us;
                        }
                    }

                    //get items data

                    needle.get('https://api.mercadolibre.com/items?ids=' + items.join(),
                        {secureProtocol: "SSLv3_method"},
                        function (err, rIt) {
                            //console.log('its ', rIt.body);
                            if (!Array.isArray(rIt.body))
                                rIt.body = [rIt.body];
                            for (var i = 0; i < rIt.body.length; i++) {
                                var item = rIt.body[i];
                                for (var j = 0; j < ret.length; j++) {
                                    var objRet = ret[j];
                                    if (objRet.info.item_id == item.id)
                                        ret[j].item = item;
                                }
                            }
                            res.json(ret);
                        }
                    )

                }
            );

        }
    );
};

//busca las últimas ordenes
exports.getAllOrders = function (req, res) {
    needle.get(
        'https://api.mercadolibre.com/orders/search/recent/?seller=' + req.session.idClient + "&access_token=" + req.session.access_token,
        {secureProtocol: "SSLv3_method"},
        function (a, rOrder) {
            var result = rOrder.body.results;
            var items = [];
            for (var i = 0; i < result.length; i++) {
                var obj = result[i];
                result[i].item = undefined;
                result[i].user = result[i].buyer;
                if (items.indexOf(obj.order_items[0].item.id) == -1)
                    items.push(obj.order_items[0].item.id);

            }


            needle.get('https://api.mercadolibre.com/items?ids=' + items.join(),
                {secureProtocol: "SSLv3_method"},
                function (err, rIt) {
                    //console.log('its ', rIt.body);
                    if (!Array.isArray(rIt.body))
                        rIt.body = [rIt.body];
                    for (var i = 0; i < rIt.body.length; i++) {
                        var item = rIt.body[i];
                        for (var j = 0; j < result.length; j++) {
                            var objRet = result[j];
                            if (objRet.order_items[0].item.id == item.id)
                                result[j].item = item;
                        }


                    }
                    res.json(result);
                }
            );

        }

    )

};

//envia la respuesta
exports.setResp = function (req, res) {

    console.log('sending respnse: ', req.body);
    var data = {
        question_id: parseInt(req.body.id),
        text: req.body.text
    };
    var url = 'https://api.mercadolibre.com/answers?access_token=' + req.session.access_token;
    console.log('url respuesta: ', url);
    console.log(data);
    needle.post(
        url,
        JSON.stringify(data),
        {secureProtocol: "SSLv3_method",
            headers: {
                "Content-Type": "application/json"
            }},
        function (a, b) {
            console.log(a, b.body);
        }
    );

    res.json({});
};