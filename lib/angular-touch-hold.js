/** 
 * @license AngularJS v1.2.0-rc.2 
 * (c) 2010-2012 Google, Inc. http://angularjs.org 
 * License: MIT 
 */ 
(function(window, angular, undefined) { 
    'use strict'; 

    /** 
    * @ngdoc overview 
    * @name ngTouch 
    * @description 
    * 
    * # ngTouch 
    * 
    * `ngTouch` is the name of the optional Angular module that provides touch events and other 
    * helpers for touch-enabled devices. 
    * The implementation is based on jQuery Mobile touch event handling 
    * ([jquerymobile.com](http://jquerymobile.com/)) 
    * 
    * {@installModule touch} 
    * 
    * See {@link ngTouch.$swipe `$swipe`} for usage. 
    */ 

    // define ngTouch module 
    var ngTouch = angular.module('ngTouch.hold', ['ngTouch']); 

    ngTouch.directive('ngHold', ['$parse', '$swipe', function($parse, $swipe) { 
        // The maximum vertical delta for a swipe should be less than 75px. 
        var MAX_VERTICAL_DISTANCE = 30; 
        // Vertical distance should not be more than a fraction of the horizontal distance. 
        var MAX_VERTICAL_RATIO = 0.3; 
        // At least a 30px lateral motion is necessary for a swipe. 
        var MIN_HORIZONTAL_DISTANCE = 30; 

        return function(scope, element, attr) { 
            var holdHandler = $parse(attr['ngHold']); 

            var startCoords, valid, timer; 

            function validHold(coords) { 
                // Check that it's within the coordinates. 
                // Absolute vertical distance must be within tolerances. 
                // Horizontal distance, we take the current X - the starting X. 
                // This is negative for leftward swipes and positive for rightward swipes. 
                // After multiplying by the direction (-1 for left, +1 for right), legal swipes 
                // (ie. same direction as the directive wants) will have a positive delta and 
                // illegal ones a negative delta. 
                // Therefore this delta must be positive, and larger than the minimum. 
                if (!startCoords) return false; 
                var deltaY = Math.abs(coords.y - startCoords.y); 
                var deltaX = (coords.x - startCoords.x); 
                return valid && // Short circuit for already-invalidated swipes. 
                deltaY < MAX_VERTICAL_DISTANCE && 
                deltaX < MIN_HORIZONTAL_DISTANCE; 
            } 

            $swipe.bind(element, { 
                'start': function(coords) { 
                    startCoords = coords; 
                    clearTimeout(timer); 
                    timer = setTimeout(function() { 
                        if (validHold(coords)) { 
                            element.triggerHandler("hold"); 
                            holdHandler(scope); 
                            scope.$apply(); 
                        } 
                    }, 800); 
                    valid = true; 
                }, 
                'move': function(coords) { 
                    valid = validHold(coords); 
                }, 
                'cancel': function() { 
                    valid = false; 
                } 
            }); 
        }; 
    } ]); 

})(window, window.angular);
