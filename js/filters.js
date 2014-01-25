'use strict';

/* Filters */
angular.module('myApp.filters', [])
    .filter('interpolate', ['version', function(version) {
        return function(text) {
            return String(text).replace(/\%VERSION\%/mg, version);
        }
    } ])
.filter('datesimple', function() {
    return function(date) {
        if (!date) return "";
        var month = (date.getMonth() + 1);
        if (month < 10) {
            month = '0' + month;
        }
        return date.getDate() + '/' + month + '/' + date.getFullYear() || date.getYear();
    }
})
.filter('dateortime', function() {
    return function(date) {
        if (!date) return "";
        var now = new Date();
        if (now.getFullYear() == date.getFullYear() && now.getMonth() == date.getMonth() && now.getDate() == date.getDate()) {
            var minutes = date.getMinutes();
            if (minutes < 10) {
                minutes = '0' + minutes;
            }
            return 'à ' + date.getHours() + ':' + minutes;
        }
        var month = (date.getMonth() + 1);
        if (month < 10) {
            month = '0' + month;
        }
        return 'le ' + date.getDate() + '/' + month + '/' + date.getFullYear() || date.getYear();
    }
}).
filter('moment', function() {
    return function(dateString, format) {
        if (!dateString) return "";
        return moment(dateString).format(format);
    };
}).
filter('not_me', function(LoginService) {
    return function(users) {
        var user = LoginService.load();
        if (!users || !user) return users;
        var amis = [];
        angular.forEach(users, function(ami) {
            if (ami.id != user._id) amis.push(ami);
        });
        return amis;
    };
});

