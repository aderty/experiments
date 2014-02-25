'use strict';

function jsonp_callback(data) {
    // returning from async callbacks is (generally) meaningless
    console.log(data.found);
}


// Declare app level module which depends on filters, and services
var myApp = angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives', 'ajoslin.mobile-navigate', 'ngRoute', 'ngTouch', 'ngTouch.hold', 'snap'])
    .config(function ($compileProvider, $httpProvider) {
        //$compileProvider.urlSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel):/);
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel):/);
        if(!myApp.isPhone){
            $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel|filesystem|filesystem:http|data):/);
        }
        $httpProvider.interceptors.push('myHttpInterceptor');
    })
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/', { templateUrl: 'partials/homeView.html', controller: 'MainCtrl' });
        $routeProvider.when('/viewLogin', { templateUrl: 'partials/loginView.html', controller: 'LoginCtrl' });
        $routeProvider.when('/viewCahierUsers', { templateUrl: 'partials/cahierUsersView.html', controller: 'CahierUsersCtrl' });
        $routeProvider.when('/viewCahier', { templateUrl: 'partials/cahierJourView.html', controller: 'CahierJourCtrl' });
        $routeProvider.when('/viewEventDetails', { templateUrl: 'partials/detailsEventView.html', controller: 'EventDetailsCtrl' });
        $routeProvider.when('/viewEvent', { templateUrl: 'partials/newEventView.html', controller: 'EventCtrl' });
        $routeProvider.when('/viewPhotos', { templateUrl: 'partials/photoView.html', controller: 'PhotosEventCtrl' });
        $routeProvider.when('/viewNewCahier', { templateUrl: 'partials/newCahier.html', controller: 'CahierCtrl' });
        $routeProvider.when('/viewAbout', { templateUrl: 'partials/aboutView.html' });
        $routeProvider.otherwise({redirectTo: '/'});
    } ]);

myApp.isPhone = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;

function isPhonegap() {
    return typeof cordova !== 'undefined' || typeof PhoneGap !== 'undefined' || typeof phonegap !== 'undefined';
}

function isIOS() {
    return navigator.userAgent.match(/(iPad|iPhone|iPod)/g);
}
function isAndroid() {
    return navigator.userAgent.match(/Android/i);
}

document.addEventListener('deviceready', function () {
    // window.device is available only if you include the phonegap package
    // http://docs.phonegap.com/en/3.0.0/cordova_device_device.md.html#Device
    // Note for ios, you do not need to add anything to the config.xml, just add the plugin
    if (isPhonegap() && isIOS() && window.device && parseFloat(window.device.version) >= 7.0) {
        $('body').addClass('phonegap-ios-7');
    }
});

myApp.isLocal = false;

myApp.factory('myHttpInterceptor', function ($q, $rootScope, $timeout) {
    return {
        response: function (response) {
            // do something on success
            if (response.headers()['content-type'] === "application/json; charset=utf-8") {
                // Validate response if not ok reject
                if (response.data.error){
                    $timeout(function () {
                        $rootScope.$emit('erreur', response.data.error);
                    });
                    return $q.reject(response);
                }
            }
            return response;
        },
        responseError: function (response) {
            // do something on error
            return $q.reject(response);
        }
    };
});

if (myApp.isPhone) {
    // PhoneGap application
    var QUOTA = 0;
} else {
    // Web page
    var QUOTA = 4 * 1024 * 1024;
    if (window.webkitStorageInfo) {
        window.webkitStorageInfo.requestQuota(window.webkitStorageInfo.PERSISTENT, QUOTA, // amount of bytes you need
            function (availableBytes) {
                // you can use the filesystem now
            }
        );
    }
      if (window.webkitRequestFileSystem) {
            window.requestFileSystem = window.webkitRequestFileSystem;
      }
}

myApp.initialize = function () {
    myApp.modal = document.getElementById('escapingBallG');
    window.setTimeout(function () {
        myApp.initDB();
    }, 150);
}
myApp.initDB = function() {
    $.indexedDB("cahierdevie", {
        "schema": {
            "1": function (versionTransaction) {
                /*var catalog = versionTransaction.createObjectStore("enfants", {
                "autoIncrement": true,
                "keyPath": "id"
                });
                catalog.createIndex("prenom", {
                "unique": false, // Uniqueness of Index, defaults to false
                "multiEntry": false // see explanation below
                }, "prenom");
                var cart = versionTransaction.createObjectStore("cahier", {
                "autoIncrement": true,
                "keyPath": "id"
                });
                cart.createIndex("idEnfant", {
                "unique": false, // Uniqueness of Index, defaults to false
                "multiEntry": true // see explanation below
                }, "idEnfant");*/
                var catalog = versionTransaction.createObjectStore("enfants", {
                    "autoIncrement": false,
                    "keyPath": "id"
                });
                catalog.createIndex("prenom");
                var cart = versionTransaction.createObjectStore("cahier", {
                    "autoIncrement": false,
                    "keyPath": "id"
                });
                cart.createIndex("idEnfant", {
                    "unique": false, // Uniqueness of Index, defaults to false
                    "multiEntry": true // see explanation below
                }, "idEnfant");
            }
        }
    }).then(function() {
        // Once the DB is opened with the object stores set up, show data from all tables
        window.setTimeout(function() {
            angular.bootstrap(document, ['myApp']);
        }, 200);
        window.onerror = function(e, f, l) {
            alert(JSON.stringify(arguments));
            //alert(e.stack + " \n file : " + f + " \n ligne :" + l);
        }
    }, function() {
        alert("Looks like an error occured " + JSON.stringify(arguments))
    });
}
myApp.ready = function () {
    $('body').addClass('ready');
    document.body.removeChild(myApp.modal);
}

myApp.deleteDB = function(){
    // Delete the database 
    $.indexedDB("cahierdevie").deleteDatabase();
}


/*
if (settings.core.rate_app_counter === 10) {
     navigator.notification.confirm(
                'If you enjoy using domainsicle, whould you mind taking a moment to rate it? It won\'t take more than a minute. Thanks for your support!',
                function(button) {
                    // yes = 1, no = 2, later = 3
                    if (button == '1') {    // Rate Now
                        if (device_ios) {
                            window.open('itms-apps://itunes.apple.com/us/app/domainsicle-domain-name-search/id511364723?ls=1&mt=8'); // or itms://
                        } else if (device_android) {
                            window.open('market://details?id=<package_name>');
                        } else if (device_bb) {
                            window.open('http://appworld.blackberry.com/webstore/content/<applicationid>');
                        }
                        this.core.rate_app = false;
                    } else if (button == '2') { // Later
                        this.core.rate_app_counter = 0;
                    } else if (button == '3') { // No
                        this.core.rate_app = false;
                    }
                },
           'Rate domainsicle',
           'Rate domainsicle,Remind me later, No Thanks'
   );
}
*/
