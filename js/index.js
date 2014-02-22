/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },

    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('load', this.onLoad, false);
        document.addEventListener('deviceready', this.onDeviceReady, false);
        window.addEventListener("orientationchange", this.orientationChange, true);
    },
    onLoad: function() {

    },
    // deviceready Event Handler
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        //var parentElement = document.getElementById(id);
        //var listeningElement = parentElement.querySelector('.listening');
        //var receivedElement = parentElement.querySelector('.received');

        //listeningElement.setAttribute('style', 'display:none;');
        //receivedElement.setAttribute('style', 'display:block;');
        if (!window.plugins || !window.plugins.pushNotification) {
            //app.onNotificationGCM({ event: 'registered', regid: '222222222coooosdodsosd' });
            return;
        }

        console.log('Received Event: ' + id);
        var pushNotification = window.plugins.pushNotification;
        if (device.platform == 'android' || device.platform == 'Android') {
            pushNotification.register(this.successHandler, this.errorHandler, { "senderID": "482658637609", "ecb": "app.onNotificationGCM" });
        }
        else {
            pushNotification.register(this.tokenHandler, this.errorHandler, { "badge": "true", "sound": "true", "alert": "true", "ecb": "app.onNotificationAPN" });
        }
    },
    // result contains any message sent from the plugin call
    successHandler: function(result) {
        console.log('Callback Success! Result = ' + result)
    },
    errorHandler: function(error) {
        console.log(error);
    },
    onNotificationGCM: function (e) {
        switch (e.event) {
            case 'registered':
                if (e.regid.length > 0) {
                    console.log("Regid " + e.regid);
                    if ($.fn.scope && $("html").scope().addPushId) {
                        $("html").scope().addPushId(e.regid, "gcm");
                    }
                }
                break;

            case 'message':
                // this is the actual push notification. its format depends on the data model from the push server
                //alert('message = ' + e.message + ' msgcnt = ' + e.msgcnt + '->' + JSON.stringify(e.payload));
                //alert('date = ' + e.payload.date);
                //alert('cahier = ' + e.payload.cahier);
                if ($.fn.scope && $("html").scope().viewCahier) {
                    $("html").scope().viewCahier(e.payload.cahier, e.payload.date);
                }
                break;

            case 'error':
                alert('GCM error = ' + e.msg);
                break;

            default:
                alert('An unknown GCM event has occurred');
                break;
        }
    },
    tokenHandler: function (result) {
        // Your iOS push server needs to know the token before it can push to this device
        // here is where you might want to send it the token for later use.
        if ($.fn.scope && $("html").scope().addPushId) {
            $("html").scope().addPushId(result, "apn");
        }
    },
    onNotificationAPN: function(event) {
        var pushNotification = window.plugins.pushNotification;
        if (event.cahier) {
            if ($.fn.scope && $("html").scope().viewCahier) {
                $("html").scope().viewCahier(event.cahier, event.date);
            }
        }
        if (event.alert) {
            //navigator.notification.alert(event.alert);
        }
        if (event.badge) {
            pushNotification.setApplicationIconBadgeNumber(this.successHandler, this.errorHandler, event.badge);
        }
        /*if (event.sound) {
            var snd = new Media(event.sound);
            snd.play();
        }*/
    }
};
