'use strict';

myApp.run(["$rootScope", "phonegapReady", "$timeout", "config", "navSvc", "LoginService", "EnfantService", "DropBoxService", function ($rootScope, phonegapReady, $timeout, config, navSvc, LoginService, EnfantService, DropBoxService) {
    phonegapReady(function () {
        console.log("phonegapReady");
        $rootScope.ready = true;
    });
    setTimeout(function () {
        config.init().then(function () {
            $rootScope.$emit('initialized');
        });
    }, 2000);

    $rootScope.slidePage = function (path, type) {
        navSvc.slidePage(path, type);
    };

    $rootScope.$on('$routeChangeStart', function (scope, next, current) {
        $(document.body).addClass('inTransition');
    });
    $rootScope.$on('$routeChangeSuccess', function (scope, next, current) {
        $(document.body).removeClass('inTransition');
    });

    var date = new Date();
    $rootScope.currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    $rootScope.isCurrentDate = function () {
        date = new Date();
        return ($rootScope.currentDate - new Date(date.getFullYear(), date.getMonth(), date.getDate())) == 0;
    }
    $rootScope.backDate = function () {
        $rootScope.currentDate = new Date(moment($rootScope.currentDate).add('days', -1).toDate().getTime());
    }
    $rootScope.nextDate = function () {
        $rootScope.currentDate = new Date(moment($rootScope.currentDate).add('days', 1).toDate().getTime());
    }
    $rootScope.$watch('currentDate', function () {
        console.log($rootScope.currentDate);
        $rootScope.$broadcast('loadCahier');
    });
    $rootScope.predefTitle = [
        {
            id: 0,
            libelle: 'Arrivée',
            img: 'img/event/start.png'
        },
        {
            id: 1,
            libelle: 'Départ',
            img: 'img/event/depart.png'
        },
        {
            id: 2,
            libelle: 'Activité',
            img: 'img/event/jeux.png'
        },
        {
            id: 3,
            libelle: 'Déjeuner',
            img: 'img/event/repas.png'
        },
        {
            id: 4,
            libelle: 'Sieste',
            img: 'img/event/sieste.png'
        },
        {
            id: 5,
            libelle: 'Gouter',
            img: 'img/event/repas.png'
        }
    ];
    $rootScope.smileys = [
        {
            id: 0,
            name: 'heureux',
            img: 'img/humeur/heureux.svg'
        },
        {
            id: 1,
            name: 'colere',
            img: 'img/humeur/colere.svg'
        },
        {
            id: 2,
            name: 'triste',
            img: 'img/humeur/triste.svg'
        },
        {
            id: 3,
            name: 'malade',
            img: 'img/humeur/malade.svg'
        }
    ];
}]);

if (!myApp.isPhone) {
    myApp.run(["$rootScope", "EnfantService", "DropBoxService", function ($rootScope, EnfantService, DropBoxService) {
        var dropCredentials = /(.*)access_token=(.*)&token_type=(.*)&uid=(.*)&state=(.*)/.exec(location.hash);
        if (dropCredentials && dropCredentials.length && localStorage["authEnfant"]) {
            var credentials = {
                token: dropCredentials[2],
                uid: dropCredentials[4]
            }
            console.log(credentials);
            EnfantService.onLoad(function (enfants) {
                EnfantService.get(parseInt(localStorage["authEnfant"])).then(function (enfant) {
                    enfant.setCredentials(credentials);
                    console.log(enfant);
                });
                localStorage.removeItem("authEnfant");
            });
        }
    }]);
}

myApp.run(["$rootScope", "$timeout", function ($rootScope, $timeout) {

    $rootScope.showMessage = false;

    $rootScope.$on('message', function (e, msg) {
        $rootScope.showMessage = true;
        $rootScope.titre = 'Information';
        $rootScope.message = msg;
        $timeout(function () {
            $rootScope.showMessage = false;
        }, 2000);
    });
    $rootScope.$on('erreur', function (e, msg) {
        $rootScope.titre = 'Erreur';
        $rootScope.showMessage = true;
        $rootScope.message = msg;
        $timeout(function () {
            $rootScope.showMessage = false;
        }, 2000);
    });

}]);

myApp.run(["$rootScope", "phonegapReady", "$timeout", "config", "navSvc", "LoginService", "EnfantService", "CahierService", "DropBoxService", function ($rootScope, phonegapReady, $timeout, config, navSvc, LoginService, EnfantService, CahierService, DropBoxService) {
    $rootScope.isConnected = false;
    $rootScope.user = LoginService.load();
    if ($rootScope.user) {
        
        $rootScope.addPushId = function(id, type){
            LoginService.addPushId(id, type);
        }
        $rootScope.viewCahier = function (enfant, date) {
            $rootScope.currentDate = new Date(date);
            CahierService.setCurrent(null);
            EnfantService.list().then(function (dbEnfants) {
                dbEnfants.forEach(function (enf) {
                    if (enf.id != enfant) return;
                    EnfantService.setCurrent(enf);
                    navSvc.slidePage('/viewCahier');
                });
            });
        }
        
        $rootScope.isConnected = true;
        $rootScope.$on('synced', function (e) {
            app.receivedEvent('deviceready');
        });
        
        $rootScope.$on('initialized', function (e) {
            EnfantService.list().then(function (dbEnfants) {
                var i = 0, l = dbEnfants.length, enfants = {};
                for (; i < l; i++) {
                    // Si l'identifiant serveur existe -> Récupération du tick
                    if (dbEnfants[i]._id) {
                        enfants[dbEnfants[i].id] = {
                            tick: dbEnfants[i].tick
                        };
                    }
                    else {
                        // Sauvegarde pour effectuer la sauvegarde sur le serveur
                        EnfantService.save(dbEnfants[i]);
                    }
                }
                // Demande de synchro au serveur (enfants contient la liste des ticks)
                LoginService.sync({
                    user: $rootScope.user,
                    enfants: enfants
                }).then(function (data) {
                    i = 0, l = data.length;
                    var prenoms = [];
                    for (; i < l; i++) {
                        data[i].fromServer = true;
                        data[i].tick = new Date(data[i].tick);
                        EnfantService.save(data[i]);
                        prenoms.push(data[i].prenom);
                    }
                    if (data.length) {
                        $rootScope.$emit('message', "Les informations des cahiers de vie de " + prenoms.join(", ") + " ont étés mis à jour.");
                    }
                    $rootScope.$emit('synced');
                })
            });
        });
    }
    else {
        if (!demandeCompte) {
            //$rootScope.$emit('message', "Voulez-vous créer un compte ? <button ng-click=\"slidePage('/viewLogin')\">Cliquez ici</button>");
            $timeout(function () {
                navSvc.slidePage('/viewLogin');
            }, 500);
            demandeCompte = true;
        }
    }

}]);

/* Controllers */
function HomeCtrl($scope, navSvc, $rootScope, EnfantService, CahierService) {
    $rootScope.showSettings = false;
    $scope.slidePage = function (path, type) {
        navSvc.slidePage(path, type);
    };
    $rootScope.date = new Date();
    $scope.back = function () {
        navSvc.back();
    };
    $scope.changeSettings = function () {
        $rootScope.showSettings = true;
    };
    $scope.closeOverlay = function () {
        $rootScope.showSettings = false;
    };

    $scope.optsNavigation = {
        disable: 'right',
        touchToDrag: false
    };
}
var demandeCompte = false;
function NavigationCtrl($scope, navSvc, $rootScope, $timeout, LoginService) {
    /*$scope.backDate = function(){
        $rootScope.currentDate.setDate($rootScope.currentDate.getDate()-1);
        $rootScope.currentDate = new Date($rootScope.currentDate.getTime());
    }
    $scope.nextDate = function(){
        $rootScope.currentDate.setDate($rootScope.currentDate.getDate()+1);
        $rootScope.currentDate = new Date($rootScope.currentDate.getTime());
    }*/
    $scope.connect = function (path, type) {
        navSvc.slidePage('/viewLogin');
    };
    /*$scope.disconnect = function (path, type) {
        LoginService.disconnect();
        navSvc.slidePage('/viewLogin'); 
    };*/
}

function MessageCtrl($scope, $rootScope, $timeout) {
}

function MainCtrl($scope, navSvc, $rootScope, $timeout, EnfantService, CahierService, notification) {
    $scope.loaded = false;
    $scope.slidePage = function (path, type) {
        navSvc.slidePage(path, type);
    };

    $scope.update = function (enfant) {
        EnfantService.setCurrent(enfant);
        navSvc.slidePage('/viewNewCahier');
    }
    $scope.remove = function (enfant) {
        notification.confirm('Etes-vous sur ?', function (button) {
            // yes = 1, no = 2, later = 3
            if (button != '1') return;

            EnfantService.remove(enfant).then(function () {
                $scope.$emit("reload");
            });
        }, 'Cahier de vie', ['Supprimer', 'Annuler']);
    }

    $rootScope.showEnfantOverlay = false;

    $scope.showMenuEnfant = function (enfant) {
        EnfantService.setCurrent(enfant);
        $rootScope.showEnfantOverlay = true;
    };



    $scope.showCahier = function (enfant) {
        if (enfant != EnfantService.getCurrent()) {
            CahierService.setCurrent(null);
            EnfantService.setCurrent(enfant);
        }
        navSvc.slidePage('/viewCahier');
    };

    $scope.newCahier = function () {
        EnfantService.setCurrent(null);
        navSvc.slidePage('/viewNewCahier');
    }
    /*$timeout(function () {
        
    }, 250);*/
    loadEnfants();

    /*EnfantService.onChange(loadCahier);
    
    $scope.$on('$destroy', function() {
          EnfantService.removeOnChange(loadCahier);
    });*/

    //$rootScope.$watch('currentDate', loadCahier);

    $scope.$on("reload", function () {
        $timeout(function () {
            loadEnfants();
        });
        //$scope.$apply();
    });

    function loadEnfants() {
        EnfantService.list().then(function (enfants) {
            $scope.enfants = enfants;
            $scope.loaded = true;
            $timeout(function () {
                $scope.$broadcast("refresh-scroll");
            }, 150);
        });
    }

    function loadCahier() {
        if (!EnfantService.getCurrent()) return;
        CahierService.get(EnfantService.getCurrent(), $rootScope.currentDate).then(function (cahier) {
            if (!cahier) {
                cahier = CahierService.new(EnfantService.getCurrent(), $rootScope.currentDate);
            }
            CahierService.setCurrent(cahier);
        });
    }
}

function LoginCtrl($scope, navSvc, $rootScope, $timeout, LoginService, EnfantService) {
    $scope.title = "Mon compte";
    $scope.mode = 6;
    $scope.user = LoginService.load();
    if (!$scope.user) {
        $scope.title = "Login";
        $scope.mode = 0;
        $scope.user = {};
    }
    else {
        $scope.user.pwd = "";
    }
    $scope.setMode = function (mode) {
        $scope.mode = mode;
    }
    $scope.create = function (user) {
        delete user.confirm_pwd;
        $scope.mode = 4;
        LoginService.create(user).then(function (current) {
            navSvc.back();
            $rootScope.isConnected = true;
        }, function (current) {
            $scope.mode = 1;
            $scope.user = {};
        });
    }
    $scope.update = function (user) {
        delete user.confirm_pwd;
        $scope.mode = 7;
        LoginService.update(user).then(function (current) {
            navSvc.back();
        }, function (current) {
            $scope.mode = 6;
            $scope.user = LoginService.load();
            $scope.user.pwd = "";
        });
    }
    $scope.connect = function (user) {
        $scope.mode = 3;
        LoginService.connect(user).then(function (current) {
            $rootScope.isConnected = true;
            LoginService.sync({
                user: current,
                enfants: {}
            }).then(function (data) {
                var i = 0, l = data.length;
                var prenoms = [];
                for (; i < l; i++) {
                    data[i].fromServer = true;
                    data[i].tick = new Date(data[i].tick);
                    EnfantService.save(data[i]);
                    prenoms.push(data[i].prenom);
                }
                if (data.length) {
                    $rootScope.$emit('message', "Les informations des cahiers de vie de " + prenoms.join(", ") + " ont étés mis à jour.");
                }
                navSvc.back();
            })
        }, function (current) {
            $scope.mode = 2;
            $scope.user = {};
        });
    }
    $scope.disconnect = function (path, type) {
        LoginService.disconnect();
        $rootScope.isConnected = false;
        $scope.mode = 0;
    };
}

function CahierJourCtrl($scope, $rootScope, navSvc, LoginService, EnfantService, CahierService, EventService, $timeout, $filter, notification, Device) {
    $scope.loaded = true;
    $scope.sending = false;
    $scope.showSmiley = false;

    var currentUser = LoginService.load();

    function loadCahier() {
        if (!EnfantService.getCurrent()) return;
        $scope.loaded = false;
        CahierService.get(EnfantService.getCurrent(), $rootScope.currentDate).then(function (cahier) {
            if (!cahier) {
                cahier = CahierService.new(EnfantService.getCurrent(), $rootScope.currentDate);
            }
            $scope.loaded = true;
            CahierService.setCurrent(cahier);
            $timeout(function () {
                $scope.$broadcast("refresh-scroll");
            }, 150);
        });
    }

    function changeCahier(cahier) {
        $scope.currentCahier = cahier;
        $scope.currentEnfant = EnfantService.getCurrent();
        $timeout(function () {
            $scope.$broadcast("refresh-scroll");
        }, 150);
    }

    $scope.currentCahier = CahierService.getCurrent();
    $scope.currentEnfant = EnfantService.getCurrent();
    if (!$scope.currentCahier) {
        loadCahier();
    }
    $scope.$on('loadCahier', function () {
        loadCahier();
    });
    $scope.send = function () {
        if (!confirm("Etes-vous sûre de vouloir envoyer le cahier de vie ?")) return false;
        if (!EnfantService.getCurrent().email) {
            return alert("Aucune adresse email définie pour l'enfant.");
        }
        $scope.sending = true;
        $scope.labelTransmi = "Envoi...";
        CahierService.send(EnfantService.getCurrent()).then(function () {
            $scope.sending = false;
            $scope.currentCahier = CahierService.getCurrent();
            $scope.labelTransmi = "Envoyé !";
            alert("Cahier envoyé !");
            $scope.$apply();
        }, function (err) {
            $scope.sending = false;
            $scope.labelTransmi = "Réessayer";
            //alert("Problème lors de l'envoie du cahier...");
            alert(err);
            $scope.$apply();
        }, function (progress) {
            $scope.progress = progress + ' %';
        });
    }
    $scope.showHumeur = function () {
        $scope.showSmiley = !$scope.showSmiley;
    }
    $scope.setHumeur = function (smiley) {
        $scope.currentCahier.humeur = smiley;
        $scope.showSmiley = false;
        CahierService.save(EnfantService.getCurrent(), $scope.currentCahier);
    }

    EnfantService.onChange(loadCahier);
    Device.onResume(loadCahier);

    $scope.$on('$destroy', function () {
        EnfantService.removeOnChange(loadCahier);
        CahierService.removeOnChange(changeCahier);
    });

    CahierService.onChange(changeCahier);

    $scope.newEvent = function () {
        EventService.setCurrent(null);
        navSvc.slidePage("/viewEvent");
    }
    $scope.editEvent = function (event) {
        EventService.setCurrent(event);
        navSvc.slidePage("/viewEventDetails");
    }
    $scope.removeEvent = function (event, index) {
        if (event.creator.id != currentUser._id) return;
        notification.confirm("Etes-vous sûre de vouloir supprimer cet évènement ?", function (confirm) {
            if (confirm != 1) return false;
            CahierService.removeEvent(EnfantService.getCurrent(), $scope.currentCahier, event).then(function () {
                $scope.$broadcast("refresh-scroll");
            });
        }, "Cahier de vie", ["Oui", "Non"]);
        return false;
    }
    $scope.prevEnfant = function () {
        EnfantService.prev();
    }
    $scope.nextEnfant = function () {
        EnfantService.next();
    }
    $scope.modifierEnfant = function () {
        navSvc.slidePage('/viewNewCahier');
    }
    function setlabelTransmi() {
        if (!$scope.sending) {
            $scope.labelTransmi = $scope.currentCahier && $scope.currentCahier.lastSync ? 'Transmi ' + $filter('dateortime')($scope.currentCahier.lastSync) : 'Envoyer';
        }
        else {
            $scope.labelTransmi = $scope.progress;
        }
    }
    $scope.$watch('currentCahier.lastSync', function () {
        setlabelTransmi();
    });
    $scope.$watch('progress', function () {
        setlabelTransmi();
    });
    setlabelTransmi();
}

function CahierCtrl($scope, navSvc, EnfantService, CahierService, EventService, DropBoxService, notification) {

    $scope.enfant = EnfantService.getCurrent();
    $scope.title = "Nouveau cahier";

    if (!$scope.enfant) {
        $scope.enfant = {
            id: new Date().getTime(),
            creation: true
        }
    }
    else {
        $scope.title = "Modification de cahier";
        $scope.enfantSaved = angular.copy($scope.enfant);
    }

    $scope.add = function (enfant) {
        if (!enfant) return;
        if (!enfant.prenom || enfant.prenom == "") {
            notification.alert("Veuillez saisir un prénom.", function () {}, "Cahier de vie", "Ok");
            return;
        }
        if (!enfant.id) {
            enfant.id = new Date().getTime();
        }
        if (enfant.creation) {
            delete enfant.creation;
        }
        enfant.tick = new Date();
        EnfantService.save(enfant).then(function () {
            navSvc.back();
            $scope.$apply();
        });
    }
    $scope.remove = function (enfant) {
        notification.confirm('Etes-vous sur?', function (button) {
            // yes = 1, no = 2, later = 3
            if (button == '1') {    // Rate Now
                EnfantService.remove(enfant).then(function () {
                    navSvc.back();
                });
            }
        }, 'Cahier de vie', ['Supprimer', 'Annuler']);
    }
    $scope.cancel = function () {
        if (!$scope.enfant.creation) {
            angular.extend($scope.enfant, $scope.enfantSaved);
            $scope.enfantSaved = null;
        }
        navSvc.back();
    }
    $scope.takePic = function () {
        var options = {
            quality: 45,
            destinationType: Camera.DestinationType.DATA_URL, //Camera.DestinationType.DATA_URL,
            sourceType: 1,      // 0:Photo Library, 1=Camera, 2=Saved Photo Album
            encodingType: 0,     // 0=JPG 1=PNG
            targetWidth: 1000,
            targetHeight: 1000,
            correctOrientation: true
        }
        // Take picture using device camera and retrieve image as base64-encoded string
        navigator.camera.getPicture(onSuccess, onFail, options);
    }

    var onSuccess = function (imageData) {
        var image = document.createElement("img");
        image.onload = function () {
            var square = 200;
            var canvas = document.createElement('canvas');

            canvas.width = square;
            canvas.height = square;

            var context = canvas.getContext('2d');
            context.clearRect(0, 0, square, square);
            var imageWidth;
            var imageHeight;
            var offsetX = 0;
            var offsetY = 0;

            if (this.width > this.height) {
                imageWidth = Math.round(square * this.width / this.height);
                imageHeight = square;
                offsetX = -Math.round((imageWidth - square) / 2);
            } else {
                imageHeight = Math.round(square * this.height / this.width);
                imageWidth = square;
                offsetY = -Math.round((imageHeight - square) / 2);
            }

            context.drawImage(this, offsetX, offsetY, imageWidth, imageHeight);
            var data = canvas.toDataURL('image/jpeg');

            $scope.$apply(function () {
                $scope.enfant.photo = data;
            });

        };
        image.src = "data:image/jpeg;base64," + imageData;
    };
    var onFail = function (e) {
        console.log("On fail " + e);
    };

    $scope.authenticate = function () {
        DropBoxService.init();
        localStorage["authEnfant"] = $scope.enfant.id;
        DropBoxService.authenticate(function (err, client) {
            if (err) {
                console.error(err);
                notification.alert('Authentification dropbox KO...', function (button) { }, 'Cahier de vie', 'Continuer');
                alert("Authentification dropbox KO...");
                alert(err);
                DropBoxService.reset();
                return;
            }
            notification.alert('Authentification dropbox réussie.', function (button) { }, 'Cahier de vie', 'Continuer');
            var credentials = client.credentials();
            if (client.authStep == 5 && credentials) {
                $scope.enfant.setCredentials(credentials);
                //$scope.$apply();
            }
            DropBoxService.reset();
        });
    }
}

function CahierUsersCtrl($scope, navSvc, EnfantService, LoginService, notification) {

    $scope.enfant = EnfantService.getCurrent();
    $scope.title = "Mes amis";

    $scope.add = function (email, form) {
        if (!email) {
            notification.alert('Veuillez saisir un email.', function (button) { }, 'Cahier de vie', 'Ok');
            return;
        }
        form.email = "";
        LoginService.addUser($scope.enfant, email).then(function (data) {
            if (data.user) {
                $scope.enfant.users.push(data.user);
            }
            $scope.enfant.tick = data.tick;
            $scope.enfant.fromServer = true;
            EnfantService.save($scope.enfant);
            //$scope.$apply();
        });
    }
    $scope.remove = function (user) {
        notification.confirm('Etes-vous sur?', function (button) {
            // yes = 1, no = 2, later = 3
            if (button == '1') {    // Rate Now
                LoginService.removeUser($scope.enfant, user).then(function (data) {
                    var index = $scope.enfant.users.indexOf(user);
                    $scope.enfant.users.splice(index, 1);
                    $scope.enfant.tick = data.tick;
                    $scope.enfant.fromServer = true;
                    EnfantService.save($scope.enfant);
                    //$scope.$apply();
                });
            }
        }, 'Cahier de vie', ['Supprimer', 'Annuler']);
    }
}

function EventDetailsCtrl($scope, $rootScope, navSvc, LoginService, EnfantService, CahierService, EventService, $timeout, notification, Device) {
    $scope.currentEnfant = EnfantService.getCurrent();
    $scope.currentCahier = CahierService.getCurrent();
    $scope.event = EventService.getCurrent();

    $scope.backEvent = function () {
        EventService.backEvent().then(function (event) {
            $scope.event = event;
            $scope.currentCahier = CahierService.getCurrent();
            $timeout(function () {
                $scope.$broadcast("reload-scroll");
            }, 0);
        });
    }
    $scope.nextEvent = function () {
        EventService.nextEvent().then(function (event) {
            $scope.event = event;
            $scope.currentCahier = CahierService.getCurrent();
            $timeout(function () {
                $scope.$broadcast("reload-scroll");
            }, 0);
        });
    }

    $scope.newEvent = function () {
        EventService.setCurrent(null);
        navSvc.slidePage("/viewEvent");
    }

    Device.onBackbutton(function (e) {
        if ($scope.inShowPhotosMode) {
            Code.PhotoSwipe.Current.hide();
        }
    });

    $scope.inShowPhotosMode = false;
    $scope.showPhotos = function () {
        if (!$scope.event.pictures) return;
        Code.PhotoSwipe.Current.setOptions({
            backButtonHideEnabled: false,
            getImageSource: function (e) {
                return e.url;
            },
            getImageCaption: function (e) {
                return "";
            }
        });
        Code.PhotoSwipe.Current.setImages($scope.event.pictures);
        // Start PhotoSwipe
        Code.PhotoSwipe.Current.show(0);
        $scope.inShowPhotosMode = true;
        // Suppression du bouton de suppresion
        angular.element("i.delete-icon.white").hide();
        
        //navSvc.slidePage("/viewPhotos");
        // A la fermeture on se désabonnedu click
        Code.PhotoSwipe.Current.addEventListener(Code.PhotoSwipe.EventTypes.onBeforeHide, function () {
            $scope.inShowPhotosMode = false;
            Code.PhotoSwipe.Current.removeEventListener(Code.PhotoSwipe.EventTypes.onBeforeHide);
        });
    }
}



function EventCtrl($scope, $rootScope, navSvc, LoginService, EnfantService, CahierService, EventService, $timeout, db, notification, Device) {
    $rootScope.showEnfantOverlay = false;
    $scope.event = EventService.getCurrent();
    $scope.showPhotoMenu = false;
    $scope.popTitle = false;
    $scope.inputTitle = false;

    if (!$scope.event) {
        $scope.popTitle = true;
        var heure = new Date().getHours();
        if (heure < 10) {
            heure = '0' + heure;
        }
        var minutes = new Date().getMinutes();
        if (minutes < 10) {
            minutes = '0' + minutes;
        }
        var currentUser = LoginService.load();
        $scope.event = {
            creation: true,
            time: heure + ":" + minutes,
            type: 2,
            title: "",
            pictures: []
        };
        EventService.setCurrent($scope.event);
    }
    else {
        $scope.eventSaved = angular.copy($scope.event);
    }
    $scope.$broadcast("refresh-scroll");
    /*var lastTitle;
    $scope.showTitle = function(){
        //$scope.popTitle = true;
        $scope.inputTitle = true;
        lastTitle = $scope.event.title;
        if(lastTitle == "Titre") $scope.event.title = "";
        $(document.getElementById("inputTitle")).click().focus();
    }
    $scope.hideTitle = function(){
        $scope.inputTitle = false;
    }
    $scope.resetTitle = function(){
        $scope.inputTitle = false;
        $scope.event.title = lastTitle;
    }*/
    $scope.showDesc = function () {
        $(document.getElementById("descriptionInput")).focus();
    }

    /*$scope.$watch("event.type", function (type) {
        $scope.event.title = type;
    });*/

    /*$scope.indexPhoto = 0;
    var validSwipe = true;
    $scope.prevPhoto = function () {
        if (!$scope.event.pictures.length) return;
        $scope.indexPhoto = ($scope.indexPhoto + 1) % $scope.event.pictures.length;

        $scope.currentPhoto = $scope.event.pictures[$scope.indexPhoto];
        validSwipe = false;
        setTimeout(function(){
            validSwipe = true;
        },200);
    }
    $scope.nextPhoto = function () {
        if (!$scope.event.pictures.length) return;
        if ($scope.indexPhoto == 0) {
            $scope.indexPhoto = $scope.event.pictures.length - 1;
        }
        else {
            $scope.indexPhoto = $scope.indexPhoto - 1;
        }
        $scope.currentPhoto = $scope.event.pictures[$scope.indexPhoto];
        validSwipe = false;
        setTimeout(function(){
            validSwipe = true;
        },200);
    }
    $scope.goTo = function (index) {
        $scope.indexPhoto = index;
    }*/

    $scope.takePic = function (type) {
        if (type === undefined) {
            $scope.showPhotoMenu = !$scope.showPhotoMenu;
            return;
        }
        $scope.showPhotoMenu = false;
        var options = {
            quality: 60,
            destinationType: Camera.DestinationType.FILE_URI, //Camera.DestinationType.DATA_URL,
            sourceType: type,      // 0:Photo Library, 1=Camera, 2=Saved Photo Album
            encodingType: 0,     // 0=JPG 1=PNG
            targetWidth: 1000,
            targetHeight: 1000,
            correctOrientation: true
        }
        if (myApp.isPhone) {
            // Take picture using device camera and retrieve image as base64-encoded string
            navigator.camera.getPicture(onSuccess, onFail, options);
        }
        else {
            initFallBack();
        }
    }

    function initFallBack() {
        function handleFileSelect(evt) {
            var files = evt.target.files; // FileList object

            // Loop through the FileList and render image files as thumbnails.
            for (var i = 0, f; f = files[i]; i++) {
                if (i == 3) return;
                // Only process image files.
                if (!f.type.match('image.*')) {
                    continue;
                }

                var reader = new FileReader();

                // Closure to capture the file information.
                reader.onload = (function (theFile) {
                    return function (e) {
                        setTimeout((function (url) {
                            return function () {
                                onSuccess(url);
                            }
                        })(e.target.result), 50);
                    };
                })(f);
                // Read in the image file as a data URL.
                reader.readAsDataURL(f);
            }
        }

        //document.getElementById('filesEvent').addEventListener('change', handleFileSelect, false);
        $(document.getElementById('filesEvent')).one('change', handleFileSelect).click();
    }

    /*var dataURLToBlob = function(dataURL) {
       var BASE64_MARKER = ';base64,';
       if (dataURL.indexOf(BASE64_MARKER) == -1) {
         var parts = dataURL.split(',');
         var contentType = parts[0].split(':')[1];
         var raw = parts[1];
   
         return new Blob([raw], {type: contentType});
       }
   
       var parts = dataURL.split(BASE64_MARKER);
       var contentType = parts[0].split(':')[1];
       var raw = window.atob(parts[1]);
       var rawLength = raw.length;
   
       var uInt8Array = new Uint8Array(rawLength);
   
       for (var i = 0; i < rawLength; ++i) {
         uInt8Array[i] = raw.charCodeAt(i);
       }
   
       return new Blob([uInt8Array], {type: contentType});
   };*/
    var byteString, mimeString, ab, ia, blobData;
    function dataURItoBlob(dataURI, callback) {
        // convert base64 to raw binary data held in a string
        // doesn't handle URLEncoded DataURIs
        byteString = atob(dataURI.split(',')[1]);

        // separate out the mime component
        mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

        // write the bytes of the string to an ArrayBuffer
        ab = new ArrayBuffer(byteString.length);
        ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return ia;
        // write the ArrayBuffer to a blob, and you're done
        /*var bb = new BlobBuilder();
        bb.append(ab);
        return bb.getBlob(mimeString);*/
    };

    var lastName = "";
    var onSuccess = function (imageData) {
        console.log("On Success! ");
        //$scope.picData = "data:image/jpeg;base64," + imageData;
        /*$scope.imgs.push(imageData);
        $scope.$apply();*/
        var image = document.createElement("img");
        image.onload = function () {
            var maxWidth = 600,
            maxHeight = 900,
            imageWidth = this.width,
            imageHeight = this.height,
            portrait = true,
            offsetX = 0,
            offsetY = 0,
            startX = 0,
            startY = 0;

            if (imageWidth > imageHeight) {
                // On inverse
                maxWidth = 900;
                maxHeight = 600;
                portrait = false;
                /*if (imageWidth > maxWidth) {
                  imageHeight *= maxWidth / imageWidth;
                  imageWidth = maxWidth;
                }*/
            }
            /*else {
              if (imageHeight > maxHeight) {
                imageWidth *= maxHeight / imageHeight;
                imageHeight = maxHeight;
              }
            }*/
            if (myApp.isPhone) {
                window.resolveLocalFileSystemURI(imageData, function (fileEntry) {
                    resolveOnSuccess(fileEntry, portrait ? "portrait" : "paysage");
                }, resOnError);
                return;
            }

            var canvas = document.createElement('canvas');
            canvas.width = maxWidth;
            canvas.height = maxHeight;

            console.log("width : " + this.width);
            console.log("height : " + this.height);

            var context = canvas.getContext('2d');
            context.clearRect(0, 0, maxWidth, maxHeight);

            this.width = imageWidth;
            this.height = imageHeight;

            if (this.width > maxWidth) {
                startX = (this.width - maxWidth) / 2;
            }
            else {
                offsetX = -Math.round((this.width - maxWidth) / 2);
            }
            if (this.height > maxHeight) {
                startY = (this.height - maxHeight) / 2;
            }
            else {
                offsetY = -Math.round((this.height - maxHeight) / 2);
            }

            context.drawImage(this, startX, startY, imageWidth > maxWidth ? maxWidth : imageWidth, imageHeight > maxHeight ? maxHeight : imageHeight, offsetX, offsetY, this.width, this.height);

            //var data = canvas.toDataURL('image/jpeg');
            var data = imageData;

            db.getPicturesDir(EnfantService.getCurrent()).then(function (directory) {
                var name = new Date().getTime() + ".jpeg";
                if (name == lastName) {
                    name = name.substring(0, name.indexOf(".")) + "_" + ".jpeg";
                }
                lastName = name;
                console.log(name);
                directory.getFile(name, { create: true, exclusive: false }, function (fileEntry) {
                    fileEntry.createWriter(function (writer) {
                        writer.onwrite = function (evt) {
                            successMove(fileEntry, portrait ? "portrait" : "paysage");
                        };

                        blobData = dataURItoBlob(data);
                        try {
                            writer.write(blobData);
                        }
                        catch (e) {
                            writer.write(new Blob([blobData], { type: 'image/jpeg' }));//new Blob([dataURItoBlob(data)], {type: 'application/octet-binary'}));
                        }
                        //writer.abort();
                    }, resOnError);
                }, resOnError);
            });
        };

        image.src = imageData;
        //movePic(imageData);
    };
    var onFail = function (e) {
        console.log("On fail " + e);
    };

    $scope.add = function (event, skipBack) {
        if (!event) return;
        /*if(!event.title || event.title == ""){
            return alert("Veuillez saisir un titre.");
        }*/
        var currentUser = LoginService.load();
        var enfant = EnfantService.getCurrent();
        var cahier = CahierService.getCurrent();
        if (!cahier) {
            cahier = CahierService.new(enfant, $rootScope.currentDate);
        }
        if (event.creation) {
            delete event.creation;
            cahier.events.push({
                id: new Date().getTime(),
                time: event.time,
                creator: {
                    id: currentUser._id,
                    pseudo: currentUser.pseudo
                },
                last_update: {
                    id: currentUser._id,
                    pseudo: currentUser.pseudo
                },
                title: event.title,
                desc: event.desc,
                pictures: event.pictures,
                etat: 1,
                type: event.type,
                tick: new Date()
            });
        }
        else {
            if ($scope.event.creator.id != currentUser._id) return;
            $scope.event.tick = new Date;
            $scope.event.last_update = {
                id: currentUser._id,
                pseudo: currentUser.pseudo
            }
        }
        CahierService.save(enfant, cahier).then(function () {
            //$scope.$apply();
        });
        if (!skipBack) {
            navSvc.back();
        }
    }

    Device.onBackbutton(function (e) {
        notification.confirm("Voullez-vous sauvegarder l'évènement avant de quitter ?", function (confirm) {
            if (confirm != 1) return;
            $scope.add($scope.event, true);
        }, "Cahier de vie", ["Sauvergarder", "Ignorer"]);
        if ($scope.inShowPhotosMode) {
            Code.PhotoSwipe.Current.hide();
        }
    });

    $scope.cancel = function () {
        if (!$scope.event.creation) {
            angular.extend($scope.event, $scope.eventSaved);
            $scope.eventSaved = null;
        }
        navSvc.back();
    }
    $scope.inShowPhotosMode = false;
    $scope.showPhotos = function () {
        //if(!validSwipe || !$scope.event.pictures) return;
        if (!$scope.event.pictures) return;
        Code.PhotoSwipe.Current.setOptions({
            backButtonHideEnabled: false,
            getImageSource: function (e) {
                return e.url;
            },
            getImageCaption: function (e) {
                return "";
            }
        });
        Code.PhotoSwipe.Current.setImages($scope.event.pictures);
        // Start PhotoSwipe
        Code.PhotoSwipe.Current.show(0);
        $scope.inShowPhotosMode = true;
        // Affichage si le bouton avez été masqué.
        angular.element("i.delete-icon.white").show();
        // Au click sur le bouton de suppression -> Confirmation et suppression si nécessaire
        angular.element("i.delete-icon.white").bind("click", function () {
            console.log(Code.PhotoSwipe.Current.currentIndex);
            notification.confirm("Etes-vous sûre de vouloir supprimer la photo ?", function (confirm) {
                if (confirm != 1) return false;
                Code.PhotoSwipe.Current.hide();
                $scope.event.pictures.splice(Code.PhotoSwipe.Current.currentIndex, 1);
                CahierService.save(EnfantService.getCurrent(), CahierService.getCurrent());
            }, "Cahier de vie", ["Oui", "Non"]);
        });

        // A la fermeture on se désabonnedu click
        Code.PhotoSwipe.Current.addEventListener(Code.PhotoSwipe.EventTypes.onBeforeHide, function () {
            angular.element("i.delete-icon.white").unbind("click");
            $scope.inShowPhotosMode = false;
            Code.PhotoSwipe.Current.removeEventListener(Code.PhotoSwipe.EventTypes.onBeforeHide);
        });

        //navSvc.slidePage("/viewPhotos");
    }

    function movePic(file) {
        window.resolveLocalFileSystemURI(file, resolveOnSuccess, resOnError);
    }

    //Callback function when the file system uri has been resolved
    function resolveOnSuccess(entry, direction) {
        var d = new Date();
        var n = d.getTime();
        //new file name
        var newFileName = n + entry.name.substring(entry.name.indexOf("."));

        db.getPicturesDir(EnfantService.getCurrent()).then(function (directory) {
            entry.moveTo(directory, newFileName, function (newEntry) { successMove(newEntry, direction); }, resOnError);
        });
    }

    //Callback function when the file has been moved successfully - inserting the complete path
    function successMove(entry, direction) {
        //I do my insert with "entry.fullPath" as for the path
        //console.log(entry.toURL());
        //console.log("direction : " + direction);
        $scope.event.pictures.push({
            name: entry.name,
            url: entry.toURL(),
            path: entry.fullPath,
            dir: direction,
            sync: false
        });
        $timeout(function () {
            $scope.$broadcast("refresh-scroll");
        });
    }
    function resOnError(error) {
        alert(error.code);
    }
}

function PhotosEventCtrl($scope, $rootScope, navSvc, EnfantService, CahierService, EventService, notification) {
    $scope.indexPhoto = 0;
    $scope.currentPhoto = "";
    $scope.event = EventService.getCurrent();

    if ($scope.event && $scope.event.pictures.length) {
        $scope.currentPhoto = $scope.event.pictures[0];
    }

    $scope.cancel = function () {
        navSvc.back();
    }

    $scope.prevPhoto = function () {
        if (!$scope.event.pictures.length) return;
        $scope.indexPhoto = ($scope.indexPhoto + 1) % $scope.event.pictures.length;
        $scope.currentPhoto = $scope.event.pictures[$scope.indexPhoto];
    }
    $scope.nextPhoto = function () {
        if (!$scope.event.pictures.length) return;
        if ($scope.indexPhoto == 0) {
            $scope.indexPhoto = $scope.event.pictures.length - 1;
        }
        else {
            $scope.indexPhoto = $scope.indexPhoto - 1;
        }
        $scope.currentPhoto = $scope.event.pictures[$scope.indexPhoto];
    }

    $scope.deleteImg = function (index) {
        notification.confirm('Etes-vous sûre de vouloir supprimer cette photo ?', function (button) {
            // yes = 1, no = 2, later = 3
            if (button != '1') return;

            deletePic($scope.event.pictures[index].url);
            $scope.event.pictures.splice(index, 1);
            if ($scope.event.pictures.length) {
                $scope.currentPhoto = $scope.event.pictures[0];
            }
            else {
                $scope.cancel();
            }
        }, 'Cahier de vie', ['Supprimer', 'Annuler']);
        return false;
    }

    function deletePic(file) {
        window.resolveLocalFileSystemURI(file, deleteOnSuccess, resOnError);
    }
    function deleteOnSuccess(entry) {
        //new file name
        entry.remove(function (entry) {
            console.log("Removal succeeded");
        }, resOnError);
    }

    function resOnError(error) {
        alert(error.code);
    }
}

