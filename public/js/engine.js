/**
 * Created with JetBrains WebStorm.
 * User: Santiago.Cordoba
 * Date: 9/13/13
 * Time: 11:53 AM
 * To change this template use File | Settings | File Templates.
 */

var Meli = angular.module('Meli', []);
/*
 Meli.config(function ($locationProvider, $routeProvider) {
 $routeProvider
 .when('/', {
 templateUrl: '/jade/home'
 })
 .when('/ventas', {
 templateUrl: '/jade/ventas'
 })
 .when('/preguntas', {
 templateUrl: '/jade/preguntas'
 })
 .otherwise({redirectTo: '/'})
 });*/

var controllersMeli = {};

controllersMeli.navController = function ($scope, $rootScope) {

    $rootScope.questions = [];
    $rootScope.orders = [];
    $rootScope.ventasplata = 0;
    $rootScope.countquest = 0;
    $rootScope.countorder = 0;
    $rootScope.filterExpr = '';

    var cambiar = function (e) {
        if (e != undefined) {
            console.log(e.target);
            var select = $(e.target);
            $('.nav li').removeClass('active');
            select.parent().addClass('active');
            $('.container').hide();
            if (select.is('.preguntasMenu'))
                $('.preguntasCont').show();
            if (select.is('.homeMenu'))
                $('.homeCont').show();
            if (select.is('.ventasMenu'))
                $('.ventasCont').show();

        }

    };
    $('ul.nav li').on('click', cambiar);
    cambiar();
};

controllersMeli.allController = function ($scope, $rootScope) {
    var socket = io.connect('http://santi8ago8.kd.io:8081/');
    var idClient = $('.idClient').text();


    if (idClient != '' && idClient != null && idClient) {
        socket.on('connect', function () {
            // Connected, let's sign-up for to receive messages for this room
            socket.emit('room', idClient);
        });
        socket.emit('logged', {
            idClient: idClient
        });

        $.ajax({
            type: "GET",
            url: "http://santi8ago8.kd.io:8080/getAllQuest",
            success: function (a, b) {
                console.log(a, b);
                for (var i = 0; i < a.length; i++) {
                    var obj = a[i];
                    $rootScope.questions.push(obj);
                    $rootScope.countquest++;
                }
                $rootScope.$apply();
            },
            dataType: 'json'
        });
        $.ajax({
            type: "GET",
            url: "http://santi8ago8.kd.io:8080/getAllOrders",
            success: function (a, b) {
                console.log(a, b);
                for (var i = 0; i < a.length; i++) {
                    var obj = a[i];
                    $rootScope.orders.push(obj);
                    $rootScope.countorder++;
                    $rootScope.ventasplata += obj.total_amount;
                }
                $rootScope.$apply();
            },
            dataType: 'json'
        });
    }
    socket.on('questions', function (data) {

        var idQuest = data.info.id;
        var entry = true;
        for (var i = 0; i < $rootScope.questions.length; i++) {
            var obj = $rootScope.questions[i];
            if (idQuest == obj.info.id) {
                entry = false;
            }
        }
        if (entry) {
            $rootScope.questions.push(data);
            $rootScope.countquest++;
        }
        //


        $rootScope.$apply();
    });
    socket.on('orders', function (data) {

        var idOrder = data.id;
        var entry = true;
        for (var i = 0; i < $rootScope.orders.length; i++) {
            var obj = $rootScope.orders[i];
            if (idOrder == obj.id)
                entry = false;


        }
        if (entry) {

            $rootScope.orders.push(data);
            $rootScope.ventasplata += data.total_amount;
            $rootScope.countorder++;
        }
        //


        $rootScope.$apply();
    });

    socket.on('test', function (d) {
        console.log(d)
    });

    //guardar preguntas
    $rootScope.sendResp = function (resp) {
        var elem = $(event.target);
        while (!elem.is('form')) elem = $(elem.parent());

        if (elem.find('textarea').val() != '') {
            resp = {
                text: elem.find('textarea').val(),
                id: elem.find('textarea').attr('idquest'),
                time: moment().toISOString()
            };
            $.ajax({
                type: "POST",
                url: "http://santi8ago8.kd.io:8080/setResp",
                data: resp,
                success: function (a, b) {
                    console.log(a, b)
                },
                dataType: 'json'
            });
            while (!elem.is('.questItem')) elem = $(elem.parent());
            elem.hide(400, function () {
                for (var i = 0; i < $rootScope.questions.length; i++) {
                    var obj = $rootScope.questions[i];
                    if (obj.info.id == resp.id) {
                        obj.isDelete = true;
                        elem.remove();
                    }
                }
            });

        }
    }
};

Meli.controller(controllersMeli);

setInterval(function () {
    var elementos = $('.time');

    $.each(elementos, function (index, elem) {
        var t = $(elem).attr('time');
        $(elem).text(" " + moment(t).fromNow());
    });

}, 1000);
