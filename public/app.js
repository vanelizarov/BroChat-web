
var app = angular.module('BroChat', ['ngRoute']);

app.config(function($routeProvider) {
    $routeProvider
    .when('/', {
        resolve: {
            "check": function($location) {
                if (firebase.auth().currentUser) {
                    //console.log("here");
                    $location.path('/messages');
                }
            }
        },
        templateUrl: 'templates/login.html'
    })
    .when('/messages', {
        resolve: {
            "check": function($location) {
                if (!firebase.auth().currentUser) {
                    $location.path('/');
                }
            }
        },
        templateUrl: 'templates/messages.html'
    })
    .otherwise({
        redirectTo: '/'
    });
});

app.controller('NavigationController', function($scope, $location) {

    if (!firebase.auth().currentUser) {
        $(".sign-out").addClass('disabled');
    }

    $(".button-collapse").sideNav();

    $(".sign-out").click(function(event) {
        firebase.auth().signOut().then(function() {
            $location.path('/');
            $scope.$apply();
            $(".sign-out").addClass('disabled');
        }, function(error) {
            console.log('Error signinng out: ' + error);
        });
    });

});

app.controller('LoginController', function($scope, $location, $rootScope) {

     $("input").keypress(function(event) {
         if (event.which == 13) {
             event.preventDefault();
             $scope.signInClicked();
         }
     });

     $("#sign-in-button").click(function(event) {
         event.preventDefault();
         // console.log("clicked");
	     $scope.signInClicked();

     });


    function checkInputData(email, password) {
        if (email !== "" &&
            password !== "") {
            return true;
        } else {
            return false;
        }
    };

    firebase.auth().onAuthStateChanged(function(user) {
        console.log('Entered onAuthStateChanged.');

        if (user) {
            console.log('onAuthStateChanged: logged in');
            $rootScope.email = user.email; //$rootScope
            $location.path('/messages');
	        $scope.$apply();
            $(".sign-out").removeClass('disabled');
        } else {
            console.log('onAuthStateChanged: not logged in');
        }
    });

    $scope.signInClicked = function() {
        //$event.stopPropagation();

        console.log("Checking input data: " + $scope.email + " " + $scope.password);
        if (checkInputData($scope.email, $scope.password)) {
            console.log("Trying to sign in...");
            firebase.auth().signInWithEmailAndPassword($scope.email, $scope.password).catch(function(error) {
                Materialize.toast('Error logging in.', 2000);
                console.log("Error logging in: ", error.code);
            });

        } else {
            Materialize.toast('Fill all forms!', 2000);
        }

    };

});

app.controller('MessagesController', function($scope, $rootScope) {

    $scope.messages = [];
    $scope.senderId = $rootScope.email; //firebase.auth().currentUser;
    var usersRef = firebase.database().ref('users');
    var messagesRef = firebase.database().ref('messages');

    usersRef.once('value').then(function(data) {
        $.each(data.val(), function(_key, _value) {
            $.each(_value, function(v_key, v_value) {
                if ($scope.senderId === v_value) {
                    $scope.username = _value.username;
                    console.log("Found username: " + $scope.username);
                    observeMessages();
                    return;
                }

                // TODO: grep
                // $scope.username = $.grep(_value, function(value) {
                // });


            });
        });

    });

    function observeMessages() {

        console.log("Observing messages");
        messagesRef.on('child_added', function(data) {

            var dateSent = data.val().dateSent;
            var displayName = data.val().displayName;
            var senderId = data.val().senderId;
            var text = data.val().text;

            var message = {
                uid: data.key,
                dateSent: dateSent,
                displayName: displayName,
                senderId: senderId,
                text: text
            };

            $scope.messages.push(message);
            $scope.$apply();
            $("ul.collection").animate({
                        scrollTop: $("ul.collection").get(0).scrollHeight
                    },
                    500
            );
        });

        messagesRef.on('child_removed', function(data) {

            $scope.messages = $.grep($scope.messages, function(value) {
                return value.uid !== data.key;
            });

            $scope.$apply();

        });

    };


});

// app.controller('LoginController', function() {
//     console.log('LoginController');
//
//     $("input").keypress(function(event) {
//         if (event.which == 13) {
//             event.preventDefault();
//             getInputDataAndContinue();
//         }
//     });
//
//     $("#sign-in-button").click(function(event) {
//         event.preventDefault();
//         console.log("Clicked sign in");
//         getInputDataAndContinue();
//     });
//
//     firebase.auth().onAuthStateChanged(function(user) {
//         if (user) {
//             console.log("Successfully logged in: ", user.email);
//             $window.location.href = '/messages';
//
//         } else {
//             console.log("User not logged in.");
//             Materialize.toast('Not logged in.', 2000);
//         }
//     });
//
//
//     function getInputDataAndContinue() {
//         var email = $("input[name=email]").val();
//         var password = $("input[name=password]").val();
//
//         if (checkInputData(email, password)) {
//             auth(email, password);
//         } else {
//             Materialize.toast('Fill all forms!', 2000);
//         }
//     }
//
//     function checkInputData(email, password) {
//         if (email !== "" &&
//             password !== "") {
//             return true;
//         } else {
//             return false;
//         }
//     }
//
//     function auth(email, password) {
//         firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
//             console.log("Error logging in: ", error.code);
//         });
//     }
//
// });
//
// app.controller('MessagesController', function($scope) {
//
//     var usersRef = firebase.database().ref('users');
//     var messagesRef = firebase.database().ref('messages');
//
//     var currentUser = firebase.auth().currentUser;
//     $scope.username;
//
//     $scope.messages = [];
//
//     usersRef.on('child_added', function(data) {
//
//         var senderId = data.val().senderId;
//
//         if (senderId == currentUser.email) {
//             $scope.username = data.val().username;
//         }
//
//     });
//
//     messagesRef.on('child_added', function(data) {
//
//         var dateSent = data.val().dateSent;
//         var displayName = data.val().displayName;
//         var senderId = data.val().senderId;
//         var text = data.val().text;
//
//         addMessage(dateSent, displayName, senderId, text);
//
//     });
//
//     function addMessage(dateSent, displayName, senderId, text) {
//
//         var message = {
//             dateSent: dateSent,
//             displayName: displayName,
//             senderId: senderId,
//             text: text
//         };
//
//         $scope.messages.push(message);
//
//         // var message = $("<li class=\"collection-item avatar\"></li>");
//         //
//         // if (_senderId === senderId) {
//         //     $(message).addClass("blue lighten-2 white-text");
//         // }
//         //
//         // $(message).load("chat-cell.html", function() {
//         //     $(message).children(".title:first").text(displayName + " " + dateSent);
//         //     $(message).children(".message-text:first").text(text);
//         //     $("#messages-container").append(message);
//         // });
//
//     }
//
//
// })
//
// app.config(function($routeProvider, $locationProvider) {
//
//     $routeProvider.when('/', {
//         controller: 'AppController',
//         asController: 'app',
//         templateUrl: 'index.html',
//         redirectTo: function() {
//
//             var user = firebase.auth().currentUser;
//             if (user) {
//                 return '/messages';
//             } else {
//                 return '/login';
//             }
//         }
//     });
//
//     $routeProvider.when('/login', {
//         controller: 'AppController',
//         templateUrl: 'login/login-view.html'
//     });
//
//     $routeProvider.when('/messages', {
//         controller: 'AppController',
//         templateUrl: 'messages/messages-view.html'
//     });
//
//     $locationProvider.html5Mode({
//         enabled: true,
//         requireBase: false
//     });
//
// });











































//
