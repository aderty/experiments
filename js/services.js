'use strict';

/* Services */

//device.uuid

// Simple value service.
angular.module('myApp.services', []).
  value('version', 'v1');

// phonegap ready service - listens to deviceready
myApp.factory('phonegapReady', function () {
    return function (fn) {

        var queue = [];

        var impl = function () {
            queue.push(Array.prototype.slice.call(arguments));
        };
        if (!myApp.isPhone) {
            impl = fn;
        }

        document.addEventListener('deviceready', function () {
            queue.forEach(function (args) {
                fn.apply(this, args);
            });
            impl = fn;
        }, false);

        return function () {
            return impl.apply(this, arguments);
        };
    };
});

myApp.factory('geolocation', function ($rootScope, phonegapReady) {
  return {
    getCurrentPosition: function (onSuccess, onError, options) {
        navigator.geolocation.getCurrentPosition(function () {
               var that = this,
               args = arguments;

               if (onSuccess) {
                   $rootScope.$apply(function () {
                        onSuccess.apply(that, args);
                   });
                   }
               }, function () {
                    var that = this,
                    args = arguments;

                   if (onError) {
                        $rootScope.$apply(function () {
                            onError.apply(that, args);
                        });
                   }
               },
            options);
        }
    };
});

myApp.factory('accelerometer', function ($rootScope, phonegapReady) {
    return {
        getCurrentAcceleration: phonegapReady(function (onSuccess, onError) {
            navigator.accelerometer.getCurrentAcceleration(function () {
                var that = this,
                    args = arguments;

                if (onSuccess) {
                    $rootScope.$apply(function () {
                        onSuccess.apply(that, args);
                    });
                }
            }, function () {
                var that = this,
                args = arguments;

                if (onError) {
                    $rootScope.$apply(function () {
                        onError.apply(that, args);
                    });
                }
            });
        })
    };
});

myApp.factory('notification', function ($rootScope, phonegapReady) {
    return {
        alert: phonegapReady(function (message, alertCallback, title, buttonName) {
            if (!myApp.isPhone) {
                alert(message);
                alertCallback.apply(this);
                return;
            }
            navigator.notification.alert(message, function () {
                var that = this,
                    args = arguments;

                $rootScope.$apply(function () {
                    alertCallback.apply(that, args);
                });
            }, title, buttonName);
        }),
        confirm: phonegapReady(function (message, confirmCallback, title, buttonLabels) {
            if (!myApp.isPhone) {
                var rep = confirm(message);
                confirmCallback.apply(this, [rep ? 1 : 2]);
                return;
            }
            navigator.notification.confirm(message, function () {
                var that = this,
                    args = arguments;

                $rootScope.$apply(function () {
                    confirmCallback.apply(that, args);
                });
            }, title, buttonLabels);
        }),
        beep: function (times) {
            navigator.notification.beep(times);
        },
        vibrate: function (milliseconds) {
            navigator.notification.vibrate(milliseconds);
        }
    };
});

myApp.factory('navSvc', function($navigate) {
    return {
        slidePage: function (path,type) {
            $navigate.go(path,type);
        },
        back: function () {
            $navigate.back();
        }
    }
});

myApp.factory('compass', function ($rootScope, phonegapReady) {
    return {
        getCurrentHeading: phonegapReady(function (onSuccess, onError) {
            navigator.compass.getCurrentHeading(function () {
                var that = this,
                    args = arguments;

                if (onSuccess) {
                    $rootScope.$apply(function () {
                        onSuccess.apply(that, args);
                    });
                }
            }, function () {
                var that = this,
                    args = arguments;

                if (onError) {
                    $rootScope.$apply(function () {
                        onError.apply(that, args);
                    });
                }
            });
        })
    };
});

myApp.factory('contacts', function ($rootScope, phonegapReady) {
    return {
        findContacts: phonegapReady(function (onSuccess, onError) {
            var options = new ContactFindOptions();
            options.filter="";
            options.multiple=true;
            var fields = ["displayName", "name"];
            navigator.contacts.find(fields, function(r){console.log("Success" +r.length);var that = this,
                args = arguments;
                if (onSuccess) {
                    $rootScope.$apply(function () {
                        onSuccess.apply(that, args);
                    });
                }
            }, function () {
                var that = this,
                    args = arguments;

                if (onError) {
                    $rootScope.$apply(function () {
                        onError.apply(that, args);
                    });
                }
            }, options)
        })
    }
});

myApp.factory('db', function ($q) {
    function resOnError(error) {
        alert(error.code);
    }
    
    var fileSystem = null;
    var entryEnfants = null;
    var enfantsDir = {};
    var me = {
      getInstance: function(){
          return $.indexedDB("cahierdevie");
      },
      getFileSystem: function(){     
          if (window.webkitStorageInfo) {
              window.webkitStorageInfo.requestQuota(
              window.webkitStorageInfo.PERSISTENT,

              QUOTA, // amount of bytes you need

              function(availableBytes) {
                  // you can use the filesystem now
              }
            );
            if (window.webkitRequestFileSystem) {
                window.requestFileSystem = window.webkitRequestFileSystem;
            }
        }
          var defered = $q.defer();
          if (fileSystem) {
                defered.resolve(fileSystem);
          }
          window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
          window.requestFileSystem(LocalFileSystem.PERSISTENT, QUOTA, function (fileSys) {
               //The folder is created if doesn't exist
               fileSystem = fileSys;
               defered.resolve(fileSystem);
          },
          resOnError);
          return defered.promise;
      },
      getEnfantsEntry: function(){
            var defered = $q.defer();
            if (entryEnfants) {
                defered.resolve(entryEnfants);
            }
                var myFolderApp = "CahierDeVie";// + EnfantService.getCurrent().id;
                    me.getFileSystem().then(function (fileSys) {
                        //The folder is created if doesn't exist
                        fileSys.root.getDirectory(myFolderApp,
                                        { create: true, exclusive: false },
                                        function (directoryRoot) {
                                            directoryRoot.getFile("db.json",
                                                    { create: true , exclusive: false},
                                                    function (fileEntry) {
                                                        entryEnfants = fileEntry;
                                                        defered.resolve(entryEnfants);
                                                    },
                                            resOnError);
                                        },
                                        resOnError);
                    });
                    return defered.promise;
      },
      getEnfantDir: function(enfant){
            var defered = $q.defer();
            if (enfantsDir && enfantsDir[enfant.id]) {
                defered.resolve(enfantsDir[enfant.id]);
            }
                var myFolderApp = "CahierDeVie";// + EnfantService.getCurrent().id;

                    me.getFileSystem().then(function (fileSys) {
                        //The folder is created if doesn't exist
                        fileSys.root.getDirectory(myFolderApp, { create: true, exclusive: false }, function (directoryRoot) {
                                            directoryRoot.getDirectory(enfant.prenom + "_" + enfant.id, { create: true, exclusive: false }, function (directoryEnfant) {
                                                    enfantsDir[enfant.id] = {base: directoryEnfant};
                                                    directoryEnfant.getDirectory("photos", { create: true, exclusive: false }, function (directory) {
                                                         enfantsDir[enfant.id].pictures = directory;
                                                         directoryEnfant.getDirectory("data", { create: true, exclusive: false }, function (directoryData) {
                                                              enfantsDir[enfant.id].data = directoryData;
                                                              defered.resolve(enfantsDir[enfant.id]);
                                                          },
                                                          resOnError);
                                                     },
                                                     resOnError);
                                             },
                                             resOnError);
                          },
                          resOnError);
                    });
                    return defered.promise;
      },
      getEnfantBaseDir: function(enfant){
            var defered = $q.defer();
            me.getEnfantDir(enfant).then(function (directoryEnfant) {
                  defered.resolve(directoryEnfant.base);
            });
            return defered.promise;
      },
      getDataDir: function(enfant){
            var defered = $q.defer();
            me.getEnfantDir(enfant).then(function (directoryEnfant) {
                  defered.resolve(directoryEnfant.data);
            });
            return defered.promise;
      },
      getPicturesDir: function(enfant){
            var defered = $q.defer();
            me.getEnfantDir(enfant).then(function (directoryEnfant) {
                  defered.resolve(directoryEnfant.pictures);
            });
            return defered.promise;
      }
    };
    
    return me;
});

myApp.factory('config', function ($q, $http, version) {
    var configGlobal = {
        url: "upload.moncahierdevie.com",
        urlUpload: "upload.moncahierdevie.com",
        version: version
    };
    if(myApp.isLocal){
        configGlobal.url = "127.0.0.1:1480";
    }
    var url = "http://" + configGlobal.url + '/getConfig';
    
    var conf = {
        init: function () {
            var defered = $q.defer();
            $http({
                method: 'POST',
                url: url,
                data: {
                    id: window.device ? window.device.uuid : 'unknown',
                    version: version
                }
            }).
            success(function (data, status, headers, config) {
                  // this callback will be called asynchronously
                // when the response is available
                angular.extend(configGlobal, data);
                defered.resolve(true);
                
            }).
            error(function (data, status, headers, config) {
                  // called asynchronously if an error occurs
                // or server returns response with an error status.
                setTimeout(function () {
                    conf.init();
                }, 5000);
            });
            return defered.promise;
        },
        getUrlUpload: function () {
            return configGlobal.urlUpload;
        },
        getUrl: function(){
            return configGlobal.url;
        },
        getVersion: function(){
            return configGlobal.version;
        },
        setDropboxCredentials: function (credentials){//uid, token) {

        }
    };
    return conf;
});

myApp.factory('EnfantService', function ($q, db, $timeout, CahierService, LoginService) {
    var current, enfants = [], init = false;
    var enfantChangeCb = [];
    var enfantLoadCb = $.Callbacks("memory once"), loaded = false;
    
    var me = {
        list: function (idEnfant) {
            var defered = $q.defer();
            if (init) {
                defered.resolve(enfants);
            }
            else {
		        db.getInstance().objectStore("enfants").each(function (data) {
                    if (!data.value.photo) {
                        data.value.photo = 'res/user.png';
                    }
                    data.value.setCredentials = function (credentials) {
                        this.credentials = credentials;
                        if (this.prenom) {
                            me.save(this);
                        }
                    };
                    enfants.push(data.value);
                }).done(function (data) {
                    init = true;
                    $timeout(function () {
                        defered.resolve(enfants);
                        enfantLoadCb.fire(enfants);
                    });
                }).fail(function (e) {
               	    alert(e);
                    defered.reject(null);
                });
                /*db.getEnfantsEntry().then(function(fileEntry){
                       fileEntry.file(function(file) {
                             var reader = new FileReader();
                             //asnycrhonous task has finished, fire the event:
                             reader.onloadend = function(evt) {
                                    init = true;
                                    console.log("Read as text");
                                    console.log(evt.target.result);
                                    if(evt.target.result != ""){
                                            //assign the data to the global var
                                            enfants = JSON.parse(evt.target.result);
                                    }
                                    //keep working with jsonString here
                                    defered.resolve(enfants);
                             };
                             reader.readAsText(file);
                       },
                       resOnError);
                });*/
            }
            return defered.promise;
        },
        next: function () {
            var i= 0, l= enfants.length;
            for(;i<l;i++){
                if(enfants[i].id == current.id){
                    this.setCurrent(enfants[ i < l-1 ? i + 1 : 0]);
                    break;
                }
            }
            
        },
        prev: function () {
            var i= 0, l= enfants.length;
            for(;i<l;i++){
                if(enfants[i].id == current.id){
                    this.setCurrent(enfants[ i > 0 ? i - 1 : l - 1]);
                    break;
                }
            }
        },
        get: function (id) {
            var defered = $q.defer();
            if(enfants.length){
                var i=0, l = enfants.length;
                for(;i<l;i++){
                    if(enfants[i].id == id){
                        defered.resolve(enfants[i]);
                        break;
                    }
                }
            }
            else{
                db.getInstance().objectStore("enfants").get(id).done(function (data) {
                    if (data){
                        data.setCredentials = function(credentials){
                            this.credentials = credentials;
                            me.save(this);
                        };
                    }
                    $timeout(function () {
                        defered.resolve(data);
                    });
                }).fail(function () {
                    defered.reject(null);
                });
            }
            return defered.promise;
        },
        save: function (enfant) {
            var defered = $q.defer();
            if(!enfant.setCredentials){
                enfant.setCredentials = function(credentials){
                     this.credentials = credentials;
                     me.save(this);
                }
            }
            if(!enfant.users){
                enfant.users = [];
            }
            var fromServer = false;
            if(enfant.fromServer){
                fromServer = true;
                delete enfant.fromServer;
                if(LoginService.isConnected()){
                    var currentUser = LoginService.load();
                    angular.forEach(enfant.users, function(user){
                        if(user.id == currentUser._id){
                            enfant.owner = user.owner === true;
                        }
                    });
                }
            }
            else{
                enfant.needSync = true;
            }
            var index = enfants.indexOf(enfant);
            if (index == -1) {
                var i = 0, l = enfants.length, found = false;
                for(;i<l;i++){
                    if(enfants[i]._id == enfant._id){
                        enfants[i] = enfant;
                        found = true;
                        break;
                    }
                }
                if(!found){
                    if(!enfant.photo){
                        enfant.photo = 'res/user.png';
                    }
                    enfants.push(enfant);
                }
            }
            var toStore = angular.copy(enfant);
            delete toStore.setCredentials;
            return db.getInstance().objectStore("enfants").put(toStore).done(function () {
                $timeout(function () {
                    defered.resolve(true);
                });
                if(!fromServer){
                    // TODO : Sync serveur
                    me.sync(enfant);
                }
                
            }).fail(function (e, l, f) {
            	alert(e);
                //alert(e.stack + " \n file : " + f + " \n ligne :" + l);
            });
            /*db.getEnfantsEntry().then(function(fileEntry){
                      fileEntry.createWriter(function (writer) {
                          writer.onwrite = function (evt) {
                                $timeout(function () {
                                     defered.resolve(true);
                                });
                          };
                          try{
                            writer.write(JSON.stringify(enfants));
                          }
                          catch(e){
                            writer.write(new Blob([JSON.stringify(enfants)], {type: 'text/plain'}));
                          }
                          //writer.abort();
                      }, function (error) {
                             alert("create writer " + error.code);
                      });
              });*/
            return defered.promise;
        },
        remove: function(enfant) {
            var defered = $q.defer();
            CahierService.removeAll(enfant).then(function(){
                db.getInstance().objectStore("enfants").delete(enfant.id).done(function () {

                    var index = enfants.indexOf(enfant);
                    enfants.splice(index, 1);
                    
                    LoginService.removeCahier(enfant);
                    
                    db.getEnfantBaseDir(enfant).then(function(directory){
                        directory.removeRecursively(function () {
                        }, resOnError);
                    });
                    /*var myFolderApp = "CahierDeVie";// + EnfantService.getCurrent().id;

                    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
                    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSys) {
                        //The folder is created if doesn't exist
                        fileSys.root.getDirectory(myFolderApp,
                                        { create: true, exclusive: false },
                                        function (directoryRoot) {
                                            directoryRoot.getDirectory(enfant.prenom + "_" + enfant.id,
                                                    { create: true, exclusive: false },
                                                    function (directory) {
                                                        directory.removeRecursively(function () {
                                                            
                                                        }, resOnError);
                                                    },
                                            resOnError);
                                        },
                                        resOnError);
                    },
                    resOnError);*/

                    defered.resolve(true);

                }).fail(function(e, l, f) {
                    alert(e.stack + " \n file : " + f + " \n ligne :" + l);
                });
            });
            return defered.promise;
        },
        sync: function(enfant){
            LoginService.addCahier(enfant).then(function(data){
                 enfant.tick = data.tick;
                 if(data.users) enfant.users = data.users;
                 if(!enfant._id && data._id) enfant._id = data._id;
                 enfant.fromServer = true;
                 delete enfant.needSync;
                 me.save(enfant);
            });
        },
        getCurrent: function () {
            return current;
        },
        setCurrent: function (_enfant) {
            current = _enfant;
            var i=0, l = enfantChangeCb.length;
            for(;i<l; i++){
                enfantChangeCb[i].call(this, current);
            }
        },
        onChange: function (callback) {
            enfantChangeCb.push(callback);
        },
        removeOnChange: function(callback){
            var i=0, l = enfantChangeCb.length;
            for(;i<l; i++){
                if(callback == enfantChangeCb[i]){
                    enfantChangeCb.splice(i, 1);
                }
            }
        },
        onLoad: function (callback) {
            enfantLoadCb.add(callback);
        },
        removeOnLoad: function(callback){
            enfantLoadCb.remove(callback);
        }
    };
    
    me.onLoad(function(enfants){
        var i=0, l = enfants.length;
        for(;i<l; i++){
            if(enfants[i].needSync){
                  me.sync(enfants[i]);
            }
         }
    });
    function resOnError(error) {
        alert(error.code);
    }
    
    return me;
});

myApp.factory('CahierService', function ($q, db, $timeout, $http, $filter, $rootScope, config, DropBoxService) {
    var orderBy = $filter('orderBy');
    var cahierChangeCb = [];
    var ip = config.getUrlUpload();
    var url = "http://" + ip + '/send-cahier/';
    var urlPicture = "http://" + ip + '/send-picture-cahier/';
    var myFolderApp = "CahierDeVie";
    var d = new Date();
    var current = null;
    
    function genKey(id, date){
        return id + "_" + date.getFullYear() + (date.getMonth() < 9 || date.getMonth() > 11  ? '0' : '') +  (date.getMonth() + 1) + date.getDate();
    }
    
    var me = {
        "new": function (enfant, date) {
            return {
                id: genKey(enfant.id, date),
                idEnfant: enfant.id,
                date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                humeur: $rootScope.smileys[0],
                events: []
            }
        },
        list: function (enfant) {
            var defered = $q.defer();
            var cahiers = [];
            db.getInstance().objectStore("cahier").index("idEnfant").each(function (elem) {
                if (enfant.id == elem.value.idEnfant) {
                    cahiers.push(elem.value);
                }
            }, enfant.id).done(function () {
                $timeout(function () {
                    defered.resolve(cahiers);
                });
            }).fail(function () {
                defered.reject(arguments);
            });
            return defered.promise;
        },
        removeEvent: function (enfant, cahier, event) {
            //var events = cahier.events.splice(index, 1);
            var index = cahier.events.indexOf(event);
            cahier.events[index].etat = 0;
            cahier.events[index].tick = new Date();
            //if(events && events.length){
            if(cahier.events[index]){
                //deleteEvent(events[0]);
                deleteEvent(cahier.events[index]);
            }
            return me.save(enfant, cahier);
        },
        removeAll: function(enfant){
            var defered = $q.defer();
            db.getInstance().objectStore("cahier").index("idEnfant").each(function (elem) {
                // Suppression des images des évènements
                if (elem.value.idEnfant == enfant.id) {
                    elem.delete();
                }
            }, enfant.id).done(function () {
                defered.resolve(true);
            }).fail(function () {
                defered.reject(arguments);
            });
            return defered.promise;
        },
        get: function (enfant, date) {
            var defered = $q.defer();
            var cahiers = [];
            var key = genKey(enfant.id, date);
            
            db.getInstance().objectStore("cahier").get(key).done(function (data) {
                $timeout(function () {
                    defered.resolve(data);
                });
                
                function finishDownload(imgs){
                    if (!imgs || !data) return;
                    angular.forEach(data.events, function (event, key) {
                         angular.forEach(event.pictures, function(pic, key){
                              angular.forEach(imgs, function(downPic, key){
                                   if(pic.name == downPic.name || downPic.needDownload){
                                        delete pic.needDownload;
                                   }
                              });
                         });
                    });
                }
                
                DropBoxService.getCahier(enfant, date).then(function(cahier){
                    if (!cahier && !data) return;
                    var imgs = [];
                    if(!data){
                        // Non présent en local
                        data = cahier;
                        cahier.fromServer = true;
                        cahier.tick = moment(cahier.tick).toDate();
                        me.setCurrent(cahier);
                        angular.forEach(cahier.events, function(event, key){
                            imgs.push.apply(imgs, event.pictures);
                            event.tick = moment(event.tick).toDate();
                        });
                        downloadPhotos(enfant, cahier, imgs).then(function(result){
                            finishDownload(result);
                            return me.save(enfant, cahier);
                        });
                        return;
                    }
                    if(!cahier && data){
                        angular.forEach(data.events, function(event, key){
                            angular.forEach(event.pictures, function(pic, key){
                                if(pic.needDownload){
                                    imgs.push(pic);
                                }
                            });
                        });
                        downloadPhotos(enfant, data, imgs).then(function (result) {
                            finishDownload(result);
                            if(result){
                                // Mise à jour du cahier
                                me.save(enfant, data);
                                // MAJ de l'interface
                                me.setCurrent(data);
                            }
                        });
                        // Non présent sur le serveur
                        return me.sync(enfant, data);
                    }
                    // Cas des cahiers présents en local + serveur -> Synchronisation des évènements
                    var found,picFound, changed = false, needServerSync = false, remoteEvt ,localEvt;
                    // Parcours des évènements du serveur et recherche de leur présence sur ceux en local.
                    angular.forEach(cahier.events, function(remoteEvt, key){
                        remoteEvt.tick = moment(remoteEvt.tick).toDate();
                        found = false;
                        angular.forEach(data.events, function(localEvt, key){
                            if(localEvt.id == remoteEvt.id){
                                found = true;
                                // Evènement trouvé -> test de la dernière date de MAJ
                                if (localEvt.tick < remoteEvt.tick) {
                                    var locPic = angular.copy(localEvt.pictures);
                                    changed = true;
                                    angular.forEach(remoteEvt.pictures, function(remPic, key){
                                       picFound = false;
                                       angular.forEach(localEvt.pictures, function(locPic, key){
                                            if(remPic.name == locPic.name){
                                                picFound = true;
                                            }
                                       });
                                       if (!picFound) {
                                           remPic.needDownload = true;
                                           locPic.push(remPic);
                                       }
                                    });
                                    angular.extend(localEvt, remoteEvt);
                                    localEvt.pictures = locPic;
                                }
                            }
                        });
                        // Si l'évènement n'est pas trouvé sur les évènement en local -> Ajout
                        if(!found){
                            data.events.push(remoteEvt);
                            imgs.push.apply(imgs, remoteEvt.pictures);
                            changed = true;
                        }
                    });
                    // Parcours des évènements locaux et recherche de leur présence sur ceux du serveur.
                    angular.forEach(data.events, function(localEvt, key){
                        found = false;
                        angular.forEach(localEvt.pictures, function(locPic, key){
                             if(locPic.needDownload){
                                  imgs.push(locPic);
                             }
                        });           
                        angular.forEach(cahier.events, function(remoteEvt, key){
                            if(localEvt.id == remoteEvt.id){
                                found = true;
                            }
                        });
                        // Au moins 1 event n'est pas dispo sur le serveur -> Demande de synchro.
                        if(!found){
                            needServerSync = true;
                        }
                    });
                    // S'il y a au un changement ou le serveur doit être synchronisé
                    if(changed || needServerSync){
                        // S'il n'est pas nécessaire de mettre à jour le serveur -> ajout de la prop fromServer
                        if(!needServerSync){
                            data.fromServer = true;
                        }
                        downloadPhotos(enfant, data, imgs).then(function(result){
                            finishDownload(result);
                            // Mise à jour du cahier
                            me.save(enfant, data);
                            // MAJ de l'interface
                            me.setCurrent(data);
                        });
                    }
                });
            }).fail(function () {
                defered.reject(null);
            });
            return defered.promise;
        },
        getById: function (id) {
            var defered = $q.defer();
            db.getInstance().objectStore("cahier").get(id).done(function (data) {
                $timeout(function () {
                    defered.resolve(data);
                });
            }).fail(function () {
                defered.reject(null);
            });
            return defered.promise;
        },
        save: function (enfant, cahier) {
            cahier.tick = new Date();
            var defered = $q.defer();
            
            var fromServer = false;
            if(cahier.fromServer){
                fromServer = true;
                delete cahier.fromServer;
            }
            else{
                cahier.needSync = true;
                toSync[cahier.id] = {
                    _id: enfant._id,
                    id: enfant.id,
                    credentials: enfant.credentials,
                    prenom: enfant.prenom
                };
                localStorage["cahiersToSync"] = JSON.stringify(toSync);
            }
            console.log("save");
            db.getInstance().objectStore("cahier").put(cahier).done(function () {
                $timeout(function () {
                    defered.resolve(true);
                });
                if(!fromServer){
                    me.sync(enfant, cahier);
                }
                
            }).fail(function (e, l, f) {
                alert(e.stack + " \n file : " + f + " \n ligne :" + l);
            });
            return defered.promise;
        },
        sync: function (enfant, cahier) {
            if (!enfant || !cahier) return;
            var i = 0, l = cahier.events.length, imgs = [], path, run = 0;
            for (; i < l; i++) {
                var j = 0, k = cahier.events[i].pictures.length;
                for (; j < k; j++) {
                    if (!cahier.events[i].pictures[j].sync && cahier.events[i].pictures[j].path) {
                        path = cahier.events[i].pictures[j].path;
                        path = path.substring(path.lastIndexOf('/') + 1);
                        imgs.push({
                            path: path,
                            event: i,
                            picture: j
                        });
                    }
                }
            }
            if (imgs.length) {
                run = imgs.length;
                db.getPicturesDir(enfant).then(function (directory) {
                    i = 0, l = imgs.length;
                    for (; i < l; i++) {
                        directory.getFile(imgs[i].path, { create: false }, (function (item) {
                            return function (fileEntry) {
                                DropBoxService.sendPhoto(enfant, cahier, fileEntry).then(function () {
                                    cahier.events[item.event].pictures[item.picture].sync = true;
                                    //cahier.fromServer = true;
                                    //me.save(enfant, cahier);
                                    finish();
                                }, function (error) {
                                    console.error("SERVICE/CahierService/sync/sendPhoto " + error);
                                    finish();
                                });
                            }
                        })(imgs[i]), function (error) {
                            console.error("SERVICE/CahierService/sync/getFile " + error.code);
                            finish();
                        });
                    }
                }, function (error) {
                    console.error("SERVICE/CahierService/sync/getPicturesDir " + error);
                    finish();
                });
            }
            else {
                finish();
            }
            function finish(err) {
                run--;
                if (run <= 0) {
                    DropBoxService.setCahier(enfant, cahier).then(function () {
                        cahier.fromServer = true;
                        delete cahier.needSync;
                        delete toSync[cahier.id];
                        localStorage["cahiersToSync"] = JSON.stringify(toSync);
                        me.save(enfant, cahier);
                    });
                }
            }
        },
        getCurrent: function () {
            return current;
        },
        setCurrent: function (_event) {
            current = _event;
            var i=0, l = cahierChangeCb.length;
            for(;i<l; i++){
                cahierChangeCb[i].call(this, current);
            }
        },
        onChange: function (callback) {
            cahierChangeCb.push(callback);
        },
        removeOnChange: function(callback){
            var i = 0, l = cahierChangeCb.length;
            for(;i<l; i++){
                if (callback == cahierChangeCb[i]) {
                    cahierChangeCb.splice(i, 1);
                }
            }
        },
        send: function (enfant) {
            if (!current) {
                alert("Pas de cahier");
                return;
            }
            defered = $q.defer();
            // Développement
            /*setTimeout(function () {
                defered.notify(100);
                $timeout(function () {
                    defered.resolve(true);
                });
            }, 1000);*/
            var email = enfant.email, prenom = enfant.prenom;
            window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSys) {
                fileSys.root.getDirectory(myFolderApp,
                            { create: true, exclusive: false },
                            function (directoryRoot) {
                                directoryRoot.getFile(current.id + ".json", { create: true }, function (fileEntry) {
                                    fileEntry.createWriter(function (writer) {
                                        writer.onwrite = function (evt) {
                                            sendCahier(fileEntry);
                                        };
                                        cahier = angular.copy(current);
                                        cahier.date = $filter("moment")(cahier.date, 'dddd D MMMM YYYY');
                                        cahier.events = orderBy(cahier.events, 'time');
                                        pictures = [];
                                        cahier.prenom = prenom || "";
                                        cahier.email = email;
                                        cahier.nbPictures = 0;
                                        var i = 0, l = cahier.events.length;
                                        for(;i<l;i++){
                                            cahier.nbPictures += cahier.events[i].pictures.length;
                                            pictures = pictures.concat(cahier.events[i].pictures);
                                        }
                                        writer.write(JSON.stringify(cahier));
                                        //writer.abort();
                                    }, function (error) {
                                        alert("create writer " + error.code);
                                    });
                                }, function (error) {
                                    alert("createfile " + error.code);
                                });
                            }, function (error) {
                                alert("get folder " + error.code);
                            });
            }, function (error) {
                alert("sys " + error.code);
            });

            return defered.promise;
        }
    };

    var toSync = {};
    if (localStorage["cahiersToSync"]) {
        toSync = JSON.parse(localStorage["cahiersToSync"]);
        for (var id in toSync) {
            me.getById(id).then(function (cahier) {
                me.sync(toSync[id], cahier);
            })
        }
    }
    
    function downloadPhotos(enfant, cahier, imgs){
        var defered = $q.defer();
        var i=0, l = imgs.length, run = imgs.length, result = [], len;
        for(;i<l;i++){
            imgs[i].needDownload = true;
            if(!imgs[i].name){
            	finish();
            	continue;
            }
            DropBoxService.getPhoto(enfant, cahier, imgs[i].name).then((function (item) {
                return function(data) {
                    if(!data) finish();
                    db.getPicturesDir(enfant).then(function (directory) {
                        if (myApp.isPhone) {
                            var filePath = directory.fullPath + '/' + item.name;
                            if (device.platform === "Android" && filePath.indexOf("file://") === 0) {
                                filePath = filePath.substring(7);
                            }
                            var fileTransfer = new FileTransfer();
                            var uri = encodeURI(data);
                            fileTransfer.download(
                                uri,
                                filePath,
                                function (entry) {
                                    console.log("download complete: " + entry.fullPath);
                                    delete item.needDownload;
                                    item.url = entry.toURL();
                                    item.path = entry.fullPath,
                                    item.sync = true;
                                    finish();
                                },
                                function (error) {
                                    console.log("download error source " + error.source);
                                    console.log("download error target " + error.target);
                                    console.log("upload error code" + error.code);
                                    finish();
                                },
                                true
                            );
                        }
                        else {
                            directory.getFile(item.name, { create: true }, function (fileEntry) {
                                fileEntry.createWriter(function (writer) {
                                    writer.onwrite = function (evt) {
                                        delete item.needDownload;
                                        item.url = fileEntry.toURL();
                                        item.path = fileEntry.fullPath,
                                        item.sync = true;
                                        finish();
                                    };
                                    writer.onerror = function (err) {
                                        finish();
                                    };
                                    try {
                                        writer.write(data);
                                    }
                                    catch (e) {
                                        writer.write(new Blob([data], { type: 'image/jpeg' }));
                                    }
                                }, function (error) {
                                    finish();
                                });
                            }, function (error) {
                                finish();
                            });
                        }
                    }, function (error) {
                       finish();
                    });
                 }
                })(imgs[i])
            ,function (err) {
                finish(err);
            });
        }
        function finish(err){
            run--;
            if(run == 0){
                defered.resolve(imgs);
            }
        }
        if(!imgs.length){
            defered.resolve(null);
        }
        return defered.promise;
    }

    var defered = $q.defer();
    var cahier;
    var pictures = [];
    function sendCahier(fileEntry) {
        var options = new FileUploadOptions();
        options.chunkedMode = false;
        options.fileKey = "file";
        options.fileName = fileEntry.fullPath.substr(fileEntry.fullPath.lastIndexOf('/') + 1);
        options.mimeType = "text/json";

        var params = new Object();
        params.email = cahier.email;
        options.params = params;
        var ft = new FileTransfer();
        url = "http://" + config.getUrlUpload() + '/send-cahier/';
        ft.upload(fileEntry.fullPath, encodeURI(url + cahier.id), function (r) {
            // suppression du json envoyé
            fileEntry.remove();
            /*console.log("Code = " + r.responseCode);
            console.log("Response = " + r.response);
            console.log("Sent = " + r.bytesSent);*/
            if (pictures.length == 0) {
                defered.notify(100);
            }
            else {
                defered.notify(10);
            }
            sendPicture();

        }, function (error) {
            // suppression du json envoyé
            fileEntry.remove();
            try {
                if (error.code == FileTransferError.FILE_NOT_FOUND_ERR) {
                    //alert("FILE_NOT_FOUND_ERR");
                    return defered.reject("Problème technique, veuillez recommencer dans quelques instants...");
                }
                if (error.code == FileTransferError.INVALID_URL_ERR) {
                    //alert("INVALID_URL_ERR");
                    return defered.reject("Problème technique...");
                }
                if (error.code == FileTransferError.CONNECTION_ERR) {
                    //alert("CONNECTION_ERR");
                    return defered.reject("Vous devez être connecté pour envoyer le cahier de vie.");
                }
            } catch (e) { }
            defered.reject(error);
        }, options);
    }

    function sendPicture() {
        if (pictures.length == 0) {
            cahier.lastSync = new Date();
            me.save(cahier).then(function(){
                $timeout(function () {
                    defered.resolve(true);
                });
            },function(){
                $timeout(function () {
                    defered.reject("Problème lors de la mise à jour de l'état du cahier.");
                });
            });
            return;
        }
        $timeout(function () {
            var progress = 100 - (pictures.length * 100 / cahier.nbPictures + 1);
            if (progress == 99) {
                progress = 100;
            }
            defered.notify(progress.toFixed(0));
        });
        var picture = pictures.shift();

        var options = new FileUploadOptions();
        options.chunkedMode = false;
        options.fileKey = "file";
        options.fileName = picture.url.substr(picture.url.lastIndexOf('/') + 1);
        options.mimeType = "image/jpeg";

        var ft = new FileTransfer();
        urlPicture = "http://" + ip + '/send-picture-cahier/';
        ft.upload(picture.url, encodeURI(urlPicture + cahier.id), function (r) {
            sendPicture();
        }, function (error) {
            try {
                if (error.code == FileTransferError.FILE_NOT_FOUND_ERR) {
                    alert("FILE_NOT_FOUND_ERR");
                }
                if (error.code == FileTransferError.INVALID_URL_ERR) {
                    alert("INVALID_URL_ERR");
                    alert(urlPicture + cahier.id);
                }
                if (error.code == FileTransferError.CONNECTION_ERR) {
                    alert("CONNECTION_ERR");
                }
            } catch (e) { }
            defered.reject(error);
        }, options);
    }
    
    function deleteEvent(event){
        // Suppression des images des évènements
        if(event.pictures && event.pictures.length){
             var i=0, l = event.pictures.length;
             for(;i<l;i++){
                 deletePic(event.pictures[i].path);
                 //deletePic(event.pictures[i].url);
             }
        }
    }
    
    function deletePic(file) {
        db.getFileSystem().then(function(fileSystem){
            fileSystem.root.getFile(file, null, deleteOnSuccess, resOnError);
        });
        //window.resolveLocalFileSystemURI(file, deleteOnSuccess, resOnError);
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

    function win(r) {
        console.log("Code = " + r.responseCode);
        console.log("Response = " + r.response);
        console.log("Sent = " + r.bytesSent);
    }
    
    return me;
});

myApp.factory('EventService', function ($q, db, $rootScope, EnfantService, CahierService, $filter) {
    var d = new Date();
    var current = null;
    return {
        getCurrent: function () {
            return current;
        },
        setCurrent: function (_event) {
            current = _event;
        },
        nextEvent: function () {
            function back() {
                $rootScope.nextDate();
                CahierService.get(enfant, $rootScope.currentDate).then(function (ca) {
                    CahierService.setCurrent(ca);
                    if (ca && ca.events && ca.events.length) {
                        var i = 0, events = $filter("orderBy")(ca.events, 'time');
                        current = events[i++];
                        while (current && current.etat == 0) {
                            current = events[i++];
                        }
                        return defered.resolve(current);
                    }
                    return defered.resolve(null);
                    /*limit--;
                    if(limit == 0){
                        return
                    }
                    back();*/
                });
            }

            var defered = $q.defer();
            var cahier = CahierService.getCurrent();
            var index = -1, limit = 30, events;
            if (cahier) {
                events = $filter("orderBy")(cahier.events, 'time');
                for (var i = 0, e; e = events[i]; i++) {
                    if (e.id == current.id) {
                        index = i + 1;
                        break;
                    }
                }
            }
            if (events && events[index]) {
                current = events[index++];
                while (index >= 0 && current && current.etat == 0) {
                    current = events[index++];
                }
                defered.resolve(current);
            }
            else {
                var enfant = EnfantService.getCurrent();

                back();
            }
            return defered.promise;
        },
        backEvent: function () {
            function next() {
                $rootScope.backDate();
                CahierService.get(enfant, $rootScope.currentDate).then(function (ca) {
                    CahierService.setCurrent(ca);
                    if (ca && ca.events && ca.events.length) {
                        var i = ca.events.length - 1, events = $filter("orderBy")(ca.events, 'time');
                        current = events[i--];
                        while (i >= 0 && current && current.etat == 0) {
                            current = events[i--];
                        }
                        return defered.resolve(current);
                    }
                    return defered.resolve(null);
                    /*limit--;
                    if(limit == 0){
                        return
                    }
                    next();*/
                });
            }
            var defered = $q.defer();
            var cahier = CahierService.getCurrent();
            var index = -1, limit = 30, events;
            if (cahier) {
                events = $filter("orderBy")(cahier.events, 'time');
                for (var i = 0, e; e = events[i]; i++) {
                    if (e.id == current.id) {
                        index = i - 1;
                        break;
                    }
                }
            }
            if (index > 0 && events && events[index]) {
                current = events[index--];
                while (index >= 0 && current && current.etat == 0) {
                    current = events[index--];
                }
                defered.resolve(current);
            }
            else {
                var enfant = EnfantService.getCurrent();
                next();
            }
            return defered.promise;
        }
    };
});



myApp.factory('DropBoxService', function ($q, $http, $timeout, $rootScope, config, db) {
    /*if (localStorage["dropbox-auth:default:ARsKfdZNtCcMrUGvvOKOzQWjll0"]) {
        localStorage["dropbox-auth:default:ARsKfdZNtCcMrUGvvOKOzQWjll0"] = "";
    }*/

    var DROPBOX_APP_KEY = "e42anle8lkz6hww";
    var DROPBOX_APP_SECRET = "km0h5iepbirptvu";
    //var STATE = "oas_horr67r1_0.8itz2dnwm8e0cnmi";
    //var TOKEN = "ZYN4w82yM7AAAAAAAAAAAQ7dQVqLqZcOEskMgCLp7TEOcaMmw9GZLjC1N0PACd7W";//"TBq6qEVcIQEAAAAAAAAAAaLvoHrXni7Q6ST4jjKOKII5fwLRSuE1cPOEjem3ce9Y";  
    //var UID = "242955592";

    var dropbox = new Dropbox.Client({
        key: DROPBOX_APP_KEY,
        secret: DROPBOX_APP_SECRET,
        sandbox: false//,
        //token: TOKEN,
        //uid: UID
    });
    var driver;
    if (myApp.isPhone) {
        driver = new Dropbox.AuthDriver.Cordova({rememberUser:false});
    }
    else {
        //dropbox.authDriver(new Dropbox.AuthDriver.Cordova({rememberUser:true}));
        driver = new Dropbox.AuthDriver.Redirect({ rememberUser: false });
    }  
    dropbox.authDriver(driver);

    var key = "dropbox-auth:" + driver.scope + ":" + (dropbox.appHash());
    if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
    }

    function genCahierKey(id, date){
        return id + "_" + date.getFullYear() + (date.getMonth() < 9 || date.getMonth() > 11  ? '0' : '') +  (date.getMonth() + 1) + date.getDate();
    }

    var me = {
        authenticate: function(fn){
            if(myApp.isLocal){
                return fn(null);
            }
            dropbox.authenticate(fn);
        },
        setCredentials: function(credentials){
            if(myApp.isLocal){
                return;
            }
            dropbox.setCredentials(credentials);
        },
        getCahier: function(enfant, date, fn) {
            var defered = $q.defer();
            if (!enfant.credentials){
                defered.reject({error: 1});
            }else{
                dropbox.setCredentials(enfant.credentials);
                if(dropbox.isAuthenticated()){
                     toExec();
                }
                else{
                    dropbox.authenticate(toExec);
                }
            }
            function toExec(err){
                if(myApp.isLocal){
                    return defered.resolve(null);
                }
                if (err) {
                     console.error(err);
                     defered.reject(err);
                }
                getCahier(enfant, date, function(err, data){
                    if (err) {
                        console.error(err);
                        defered.reject(err);
                        return;
                    }
                    defered.resolve(data);
                });
            }
            return defered.promise;
        },
        setCahier: function (enfant, cahier, fn) {
            var defered = $q.defer();
            if (!enfant.credentials){
                defered.reject({error: 1});
            }else{
                dropbox.setCredentials(enfant.credentials);
                if(dropbox.isAuthenticated()){
                     toExec();
                }
                else{
                    dropbox.authenticate(toExec);
                }
            }
            function toExec(err){
                if(myApp.isLocal){
                    return defered.resolve(null);
                }
                if (err) {
                     console.error(err);
                     defered.reject(err);
                }
                sendCahier(enfant, cahier, function(err, data){
                     if (err) {
                          console.error(err);
                          defered.reject(err);
                          return;
                     }
                     defered.resolve(data);
                });
            }
            return defered.promise;
        },
        getPhoto: function (enfant, cahier, img, fn) {
            var defered = $q.defer();
            if (!enfant.credentials){
                defered.reject({error: 1});
            }else{
                dropbox.setCredentials(enfant.credentials);
                if(dropbox.isAuthenticated()){
                    toExec()
                }
                else{
                    dropbox.authenticate(toExec);
                }
            }
            function toExec(err){
                if(myApp.isLocal){
                    return defered.resolve(null);
                }
                if (err) {
                     console.error(err);
                     defered.reject(err);
                }
                getPhoto(enfant, cahier, img, function(err, data){
                    if (err) {
                          console.error(err);
                          defered.reject(err);
                          return;
                    }
                    defered.resolve(data);
                });
            }
            return defered.promise;
        },
        sendPhoto: function (enfant, cahier, fileEntry, fn) {
            var defered = $q.defer();
            if (!enfant.credentials){
                defered.reject({error: 1});
            }else{
                dropbox.setCredentials(enfant.credentials);
                if(dropbox.isAuthenticated()){
                    toExec();
                }
                else{
                    dropbox.authenticate(toExec);
                }
            }
            function toExec(err){
                if(myApp.isLocal){
                    return defered.resolve(null);
                }
                if (err) {
                     console.error(err);
                     defered.reject(err);
                }
                sendPhoto(enfant, cahier, fileEntry, function(err, data){
                    if (err) {
                          console.error(err);
                          defered.reject(err);
                          return;
                    }
                    defered.resolve(data);
                });
            }
            return defered.promise;
        },
        isAuthenticated: function () {
            return dropbox.isAuthenticated();
        },
        init: function(){
            me.reset();
            dropbox.authStep = 2;
                dropbox.setCredentials({
	            key: DROPBOX_APP_KEY,
	            secret: DROPBOX_APP_SECRET,
	            sandbox: false
	        });
        },
        reset: function () {
            /*if (dropbox.isAuthenticated()) {
                dropbox.signOut();
            }
            else {*/
                dropbox.reset();
            //}
            if (localStorage.getItem(key)) {
                 localStorage.removeItem(key);
            }
        }
    }
 
    var defered = $q.defer();
    var cahier;
    var pictures = [];

    function getDirectoryEnfant(enfant) {
        return enfant.prenom + '_' + enfant.id;
    }

    function sendCahier(enfant, cahier, fn) {
        var path = getDirectoryEnfant(enfant) + '/data/' + moment(cahier.date).format('YYYY_MM') + '/' + cahier.id + '.json';
        var copy = angular.copy(cahier);
        angular.forEach(copy.events, function (event) {
            if (event.title) event.title = encodeURI(event.title);
            if (event.desc) event.desc = encodeURI(event.desc);
        });
        dropbox.writeFile(path, JSON.stringify(copy), function (err, data) {
            if (err) return console.error(err);
            if (fn) fn(err, data);
        });
    }

    function getCahier(enfant, date, fn) {
        var path = getDirectoryEnfant(enfant) + '/data/' + moment(date).format('YYYY_MM') + '/' + genCahierKey(enfant.id, date) + '.json';
        dropbox.readFile(path, function (err, data) {
            if (err) {
                if (err.status != 404) {
                    console.error(err);
                }
                else {
                    err = null;
                }
            }
            var cahier = null;
            if (data) {
                try{
                    cahier = JSON.parse(data);
                    angular.forEach(cahier.events, function (event) {
                        if (event.title) event.title = decodeURI(event.title);
                        if (event.desc) event.desc = decodeURI(event.desc);
                    });
                }
                catch (e) {

                }
            }
            if (fn) fn(null, cahier);
        });

    }

    function sendPhoto(enfant, cahier, fileEntry, fn) {
        fileEntry.file(function (file) {
            var hash;
            var reader = new FileReader();
            //asnycrhonous task has finished, fire the event:
            reader.onload = function (evt) {
                var path = getDirectoryEnfant(enfant) + '/photos/' + moment(cahier.date).format('YYYY_MM') + '/' + file.name;
                dropbox.writeFile(path, evt.target.result, function (err, data) {
                    if (err) return console.error(err);
                    if (fn) fn(err, data);
                });
            };
            reader.readAsArrayBuffer(file);
        });
    }

    function getPhoto(enfant, cahier, name,fn){
        var path = getDirectoryEnfant(enfant) + '/photos/' + moment(cahier.date).format('YYYY_MM') + '/' + name;
        if (myApp.isPhone) {
            dropbox.makeUrl(path, { download: true }, function (err, data) {
                if (err) {
                    if (err.status != 404) {
                        console.error(err);
                    }
                    else {
                        err = null;
                    }
                    if (fn) fn(err, null);
                    return;
                }
                if (fn) fn(err, data.url);
            });
        }
        else {
            //dropbox.readFile(path, {arrayBuffer: true}, function (err, data) {
            dropbox.readFile(path, { blob: true }, function (err, data) {
                if (err) {
                    if (err.status != 404) {
                        console.error(err);
                    }
                    else {
                        err = null;
                    }
                }
                if (fn) fn(err, data);
            });
        }       
    }

    // Move it into the Public directory.
    /*dropbox.move('foo.txt', 'Public/foo.txt', function (err, data) {
        if (err) return console.error(err)

        // Delete the file.
        dropbox.remove('Public/foo.txt', function (err, data) {
            if (err) console.error(err.stack)
            console.log("ok");
        })
    })*/

    return me;
});

myApp.factory('LoginService', function ($q, $http, $timeout, $rootScope, config) {
    var storageKey = "LoginService:MonCahierdevie";
    var currentLogin = null, storageError;
    var me = {
        create: function (user) {
            var defered = $q.defer();
            var url = "http://" + config.getUrl() + '/new/' + config.getVersion();
            $http({
                method: 'POST',
                url: url,
                data: user
            }).
            success(function (data, status, headers, config) {
                // this callback will be called asynchronously
                // when the response is available
                me.store(data);
                defered.resolve(data);
            }).
            error(function (data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                defered.reject(arguments);
            });
            return defered.promise;
        },
        update: function (user) {
            var defered = $q.defer();
            var url = "http://" + config.getUrl() + '/update/' + config.getVersion();
            $http({
                method: 'POST',
                url: url,
                data: user
            }).
            success(function (data, status, headers, config) {
                // this callback will be called asynchronously
                // when the response is available
                me.store(data);
                defered.resolve(data);
            }).
            error(function (data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                defered.reject(arguments);
            });
            return defered.promise;
        },
        connect: function(user){
            var defered = $q.defer();
            var url = "http://" + config.getUrl() + '/login/' + config.getVersion();
            $http({
                method: 'POST',
                url: url,
                data: user
            }).
            success(function (data, status, headers, config) {
                // this callback will be called asynchronously
                // when the response is available
                me.store(data);
                defered.resolve(data);
            }).
            error(function (data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                defered.reject(arguments);
            });
            return defered.promise;
        },
        disconnect: function(){
            me.forget();
        },
        isConnected: function(){
            return me.load() != undefined;
        },
        store: function(login){
            var jsonString, name, value;
              jsonString = JSON.stringify(login);
              try {
                localStorage.setItem(storageKey, jsonString);
              } catch (e) {
                storageError = e;
                name = encodeURIComponent(storageKey);
                value = encodeURIComponent(jsonString);
                document.cookie = "" + name + "=" + value + "; path=/";
              }
              currentLogin = login;
        },
        load: function(force){
            var cookieRegexp, jsonString, match, name, nameRegexp;
            if(currentLogin && force == undefined){
                return currentLogin;
            }
              try {
                jsonString = localStorage.getItem(storageKey);
              } catch (e) {
                storageError = e;
                jsonString = null;
              }
              if (jsonString === null) {
                name = encodeURIComponent(storageKey);
                nameRegexp = name.replace(/[.*+()]/g, '\\$&');
                cookieRegexp = new RegExp("(^|(;\\s*))" + name + "=([^;]*)(;|$)");
                if (match = cookieRegexp.exec(document.cookie)) {
                  jsonString = decodeURIComponent(match[3]);
                }
              }
              if (!jsonString) {
                currentLogin = null;
                return null;
              }
              try {
                currentLogin = JSON.parse(jsonString);
              } catch (e) {
                storageError = e;
                currentLogin = null;
              }
              return currentLogin;
        },
        forget: function(){
            var expires, name;
            currentLogin = null;
              try {
                localStorage.removeItem(storageKey);
              } catch (e) {
                storageError = e;
                name = encodeURIComponent(storageKey);
                expires = (new Date(0)).toGMTString();
                document.cookie = "" + name + "={}; expires=" + expires + "; path=/";
              }
        },
        sync: function (user) {
            var defered = $q.defer();
            var url = "http://" + config.getUrl() + '/sync/' + config.getVersion();
            $http({
                method: 'POST',
                url: url,
                data: user
            }).
            success(function (data, status, headers, config) {
                // this callback will be called asynchronously
                // when the response is available
                defered.resolve(data);
            }).
            error(function (data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                defered.reject(arguments);
            });
            return defered.promise;
        },
        addCahier: function(cahier){
            var defered = $q.defer();
            var url = "http://" + config.getUrl() + '/add/' + config.getVersion();
            $http({
                method: 'POST',
                url: url,
                data: {
                    user: currentLogin,
                    cahier: cahier
                }
            }).
            success(function (data, status, headers, config) {
                // this callback will be called asynchronously
                // when the response is available
                defered.resolve(data);
            }).
            error(function (data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                defered.reject(arguments);
            });
            return defered.promise;
        },
        removeCahier: function(cahier){
            var defered = $q.defer();
            var url = "http://" + config.getUrl() + '/remove/' + config.getVersion();
            $http({
                method: 'POST',
                url: url,
                data: {
                    user: currentLogin,
                    cahier: cahier
                }
            }).
            success(function (data, status, headers, config) {
                // this callback will be called asynchronously
                // when the response is available
                defered.resolve(data);
            }).
            error(function (data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                defered.reject(arguments);
            });
            return defered.promise;
        },
        addUser: function(cahier, email){
            var defered = $q.defer();
            var url = "http://" + config.getUrl() + '/addUser/' + config.getVersion();
            $http({
                method: 'POST',
                url: url,
                data: {
                    user: currentLogin,
                    cahier: cahier._id,
                    email: email
                }
            }).
            success(function (data, status, headers, config) {
                // this callback will be called asynchronously
                // when the response is available
                defered.resolve(data);
            }).
            error(function (data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                defered.reject(arguments);
            });
            return defered.promise;
        },
        removeUser: function(cahier, user){
            var defered = $q.defer();
            var url = "http://" + config.getUrl() + '/removeUser/' + config.getVersion();
            $http({
                method: 'POST',
                url: url,
                data: {
                    user: currentLogin,
                    cahier: cahier._id,
                    target: user.id
                }
            }).
            success(function (data, status, headers, config) {
                // this callback will be called asynchronously
                // when the response is available
                defered.resolve(data);
            }).
            error(function (data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                defered.reject(arguments);
            });
            return defered.promise;
        }
    } 
    return me;
});
