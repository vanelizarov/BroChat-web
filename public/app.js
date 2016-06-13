
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

    $(".button-collapse").sideNav({
        closeOnClick: true
    });

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
             signInClicked();
         }
     });

     $("#sign-in-button").click(function(event) {
         event.preventDefault();
         // console.log("clicked");
	     signInClicked();

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

    function signInClicked() {
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

    $scope.messageText = '';

    $("#message-text").focus();

    if ($("#message-text") === '') {
        $("#send-button").addClass('disabled');
    }

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

    function addMessage(uid, dateSent, displayName, senderId, text) {
        var message = {
            uid: uid,
            dateSent: dateSent,
            displayName: displayName,
            senderId: senderId,
            text: text
        };
        $scope.messages.push(message);
        $scope.$apply();
    };

    function observeMessages() {

        console.log("Observing messages");

        messagesRef.on('child_added', function(data) {

            var dateSent = data.val().dateSent;
            var displayName = data.val().displayName;
            var senderId = data.val().senderId;
            var text = data.val().text;

            addMessage(data.key, dateSent, displayName, senderId, text);

            $("ul.collection").animate({scrollTop: $("ul.collection").get(0).scrollHeight}, 500);
        });

        messagesRef.on('child_removed', function(data) {
            $scope.messages = $.grep($scope.messages, function(value) {
                return value.uid !== data.key;
            });
            $scope.$apply();
        });

    };

    function sendCurrentMessage() {

        if (!$scope.messageText == '') {
            var date = new Date();
            var dateSent = date.getHours() + ":" + date.getMinutes();

            var messageRef = {
                dateSent: dateSent,
                displayName: $scope.username,
                senderId: $scope.senderId,
                text: $scope.messageText
            }

            var uid = firebase.database().ref().child('messages').push().key;

            var updates = {};
            updates['/messages/' + uid] = messageRef;

            firebase.database().ref().update(updates);

            $scope.messageText = '';
            $("#message-text").focus();
            $scope.$apply();
        } else {
            Materialize.toast('Empty message cannot be send', 2000);
            console.log("Empty text cannot be send");
        }

    };

    $("#send-button").click(function(event) {
        sendCurrentMessage();
    });

    $("textarea").keypress(function(event) {

        if (event.ctrlKey && event.which == 13) {
            event.preventDefault();
            sendCurrentMessage()
        }

    });

});












































//
