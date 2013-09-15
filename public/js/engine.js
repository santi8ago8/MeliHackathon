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
            templateUrl: '/jade/home',
            controller: 'resumen'
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
        }
    };
    $('ul.nav li').on('click', cambiar);
    cambiar();
};
controllersMeli.resumen = function ($scope) {
    if (!$scope.user) $scope.user = {};
    $scope.user.name = Math.random();

};

Meli.controller(controllersMeli);
