
var app = angular.module('BroChat', ['ngRoute']);
//
app.controller('AppController', function($route, $routeParams, $location) {

    this.$route = $route;
    this.$routeParams = $routeParams;
    this.$location = $location;
});

app.controller('LoginController', LoginController);
LoginController.$inject = ['$window'];

function LoginController($window) {
    console.log('LoginController');

    $("input").keypress(function(event) {
        if (event.which == 13) {
            event.preventDefault();
            getInputDataAndContinue();
        }
    });

    $("#sign-in-button").click(function(event) {
        event.preventDefault();
        console.log("Clicked sign in");
        getInputDataAndContinue();
    });

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            console.log("Successfully logged in: ", user.email);
            $window.location.href = '/messages';

        } else {
            console.log("User not logged in.");
            Materialize.toast('Error logging in!', 2000);
        }
    });


    function getInputDataAndContinue() {
        var email = $("input[name=email]").val();
        var password = $("input[name=password]").val();

        if (checkInputData(email, password)) {
            auth(email, password);
        } else {
            Materialize.toast('Fill all forms!', 2000);
        }
    }

    function checkInputData(email, password) {
        if (email !== "" &&
            password !== "") {
            return true;
        } else {
            return false;
        }
    }

    function auth(email, password) {
        firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
            console.log("Error logging in: ", error.code);
        });
    }

};

app.controller('MessagesController', function($scope) {

    var usersRef = firebase.database().ref('users');
    var messagesRef = firebase.database().ref('messages');

    var currentUser = firebase.auth().currentUser;
    $scope.username;

    $scope.messages = [];

    usersRef.on('child_added', function(data) {

        var senderId = data.val().senderId;

        if (senderId == currentUser.email) {
            $scope.username = data.val().username;
        }

    });

    messagesRef.on('child_added', function(data) {

        var dateSent = data.val().dateSent;
        var displayName = data.val().displayName;
        var senderId = data.val().senderId;
        var text = data.val().text;

        addMessage(dateSent, displayName, senderId, text);

    });

    function addMessage(dateSent, displayName, senderId, text) {

        var message = {
            dateSent: dateSent,
            displayName: displayName,
            senderId: senderId,
            text: text
        };

        $scope.messages.push(message);

        // var message = $("<li class=\"collection-item avatar\"></li>");
        //
        // if (_senderId === senderId) {
        //     $(message).addClass("blue lighten-2 white-text");
        // }
        //
        // $(message).load("chat-cell.html", function() {
        //     $(message).children(".title:first").text(displayName + " " + dateSent);
        //     $(message).children(".message-text:first").text(text);
        //     $("#messages-container").append(message);
        // });

    }


})

app.config(function($routeProvider, $locationProvider) {

    $routeProvider.when('/', {
        controller: 'AppController',
        asController: 'app',
        templateUrl: 'index.html',
        redirectTo: function() {

            var user = firebase.auth().currentUser;
            if (user) {
                return '/messages';
            } else {
                return '/login';
            }
        }
    });

    $routeProvider.when('/login', {
        controller: 'AppController',
        templateUrl: 'login/login-view.html'
    });

    $routeProvider.when('/messages', {
        controller: 'AppController',
        templateUrl: 'messages/messages-view.html'
    });

    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });

});











































//
