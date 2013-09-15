/**
 * Created with JetBrains WebStorm.
 * User: Santiago.Cordoba
 * Date: 9/13/13
 * Time: 11:53 AM
 * To change this template use File | Settings | File Templates.
 */

var Meli = angular.module('Meli', []);

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
});

var controllersMeli = {};

controllersMeli.navController = function ($scope) {

    var cambiar = function (e) {
        if (e != undefined) {
            console.log(e.target);
            var select = $(e.target);
            $('.nav li').removeClass('active');
            select.parent().addClass('active');
            $scope.$apply()
        }
    };
    $('ul.nav li').on('click', cambiar);
    cambiar();
};

controllersMeli.allController = function ($scope) {
    var socket = io.connect('http://santi8ago8.kd.io:8081/');
    var idClient = $('.idClient').text();
    $scope.questions = [];
    $scope.orders = [];
    $scope.ventasplata = 0;
    $scope.countquest = 0;
    $scope.countorder = 0;


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
                    $scope.questions.push(obj);
                    $scope.countquest++;
                }
                $scope.$apply();
            },
            dataType: 'json'
        });

    }
    socket.on('questions', function (data) {
        $scope.questions.push(data);
        $scope.countquest++;

        //


        $scope.$apply();
    });
    socket.on('orders', function (data) {
        $scope.orders.push(data);
        $scope.ventasplata += data.total_amount;
        $scope.countorder++;

        //


        $scope.$apply();
    });

    socket.on('test', function (d) {
        console.log(d)
    });

    //guardar preguntas
    $scope.sendResp = function (resp) {
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
            elem.hide(400);
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
