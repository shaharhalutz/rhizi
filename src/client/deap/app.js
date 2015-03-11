angular.module('MyApp', ['ngResource', 'ngMessages', 'ui.router', 'mgcrea.ngStrap', 'satellizer','ngAnimate','ngSanitize'])//,'ui.bootstrap'])
  .config(function($stateProvider, $urlRouterProvider, $authProvider ) {
	console.log('init AngularJs.')
	// to solve jinja issues with {} we use {{}]} : 
	//$interpolateProvider.startSymbol('{{').endSymbol('}]}');
	
	
    $stateProvider
	  .state('splash', {
		controller: 'SplashCtrl',
        url: '/splash',
        templateUrl: '/static/deap/partials/splash.html'
      })
	 .state('search', {
        url: '/search',
        templateUrl: '/static/deap/partials/search.html',
        controller: 'SearchResultsCtrl'
      })
	  .state('users', {
		controller: 'UsersCtrl',
        url: '/users',
        templateUrl: '/static/deap/partials/users.html'
      })
      .state('home', {
        url: '/home',
		controller: 'HomeCtrl',
        templateUrl: '/static/deap/partials/home.html'
      })
      .state('login', {
        url: '/login',
        templateUrl: '/static/deap/partials/login.html',
        controller: 'LoginCtrl'
      })
      .state('signup', {
        url: '/signup',
        templateUrl: '/static/deap/partials/signup.html',
        controller: 'SignupCtrl'
      })
      .state('logout', {
        url: '/logout',
        template: null,
        controller: 'LogoutCtrl'
      })
      .state('profile', {
        url: '/profile',
        templateUrl: '/static/deap/partials/profile.html',
        controller: 'ProfileCtrl',
        resolve: {
          authenticated: function($q, $location, $auth) {
            var deferred = $q.defer();

            if (!$auth.isAuthenticated()) {
              $location.path('/splash');
            } else {
              deferred.resolve();
            }

            return deferred.promise;
          }
        }
      });

    $urlRouterProvider.otherwise('/splash');

	$authProvider.slack({
      clientId: '2969711723.3476875864'
    });

    $authProvider.facebook({
      clientId: '657854390977827'
    });

    $authProvider.google({
      clientId: '1035120510059-jiep22u3drncvi3dn6i7gid380q9jvuc.apps.googleusercontent.com'
    });

    $authProvider.github({
      clientId: '0ba2600b1dbdb756688b'
    });

    $authProvider.linkedin({
      clientId: '77cw786yignpzj'
    });

    $authProvider.yahoo({
      clientId: 'dj0yJmk9SDVkM2RhNWJSc2ZBJmQ9WVdrOWIzVlFRMWxzTXpZbWNHbzlNQS0tJnM9Y29uc3VtZXJzZWNyZXQmeD0yYw--'
    });

    $authProvider.twitter({
      url: '/auth/twitter'
    });

    $authProvider.live({
      clientId: '000000004C12E68D'
    });

    $authProvider.oauth2({
      name: 'foursquare',
      url: '/auth/foursquare',
      clientId: 'MTCEJ3NGW2PNNB31WOSBFDSAD4MTHYVAZ1UKIULXZ2CVFC2K',
      redirectUri: window.location.origin || window.location.protocol + '//' + window.location.host,
      authorizationEndpoint: 'https://foursquare.com/oauth2/authenticate'
    });
  });
