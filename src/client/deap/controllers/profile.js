angular.module('MyApp')
  .controller('ProfileCtrl', function($scope, $auth, $alert, Account) {
	
	// if not authenticated return to splash:
	if(!$auth.isAuthenticated()){
		$location.path('splash'); 
    }
    /**
     * Get user's profile information.
     */
    $scope.getProfile = function() {
      Account.getProfile()
        .success(function(data) {
			console.log('profileData:');
			console.dir(data);
          	$scope.user = data;
			Account.setUserData(data);
			
        })
        .error(function(error) {
          $alert({
            content: error.message,
            animation: 'fadeZoomFadeDown',
            type: 'material',
            duration: 3
          });
        });
    };


    /**
     * Update user's profile information.
     */
    $scope.updateProfile = function() {
      Account.updateProfile({
        displayName: $scope.user.displayName,
        email: $scope.user.email
      }).then(function() {
        $alert({
          content: 'Profile has been updated',
          animation: 'fadeZoomFadeDown',
          type: 'material',
          duration: 3
        });
      });
    };

    /**
     * Link third-party provider.
     */
    $scope.link = function(provider) {
		var supportedProviders = ['trello','slack'];
		
		if(supportedProviders.indexOf(provider) == -1){
			
			$alert({
	            content: 'Under construction.',
	            animation: 'fadeZoomFadeDown',
	            type: 'material',
	            duration: 3
	          });
			return ;
		}
		
      $auth.link(provider)
        .then(function() {
          $alert({
            content: 'You have successfully linked ' + provider + ' account',
            animation: 'fadeZoomFadeDown',
            type: 'material',
            duration: 3
          });
        })
        .then(function() {
          $scope.getProfile();
        })
        .catch(function(response) {
          $alert({
            content: response.data.message,
            animation: 'fadeZoomFadeDown',
            type: 'material',
            duration: 3
          });
        });
    };

    /**
     * Unlink third-party provider.
     */
    $scope.unlink = function(provider) {
	
	   //	*************  currently not supported :
		$alert({
           content: 'Under construction.',
           animation: 'fadeZoomFadeDown',
           type: 'material',
           duration: 3
         });
		return ;
		
		//	*************
	
      $auth.unlink(provider)
        .then(function() {
          $alert({
            content: 'You have successfully unlinked ' + provider + ' account',
            animation: 'fadeZoomFadeDown',
            type: 'material',
            duration: 3
          });
        })
        .then(function() {
          $scope.getProfile();
        })
        .catch(function(response) {
          $alert({
            content: response.data ? response.data.message : 'Could not unlink ' + provider + ' account',
            animation: 'fadeZoomFadeDown',
            type: 'material',
            duration: 3
          });
        });
    };



// ***********	Trello -  Save Token - Quick and Dirty:	TBD: redue this securely		***********
	//var HOST = 'deap-env.elasticbeanstalk.com'
	var HOST = 'rhizi.local:8080';
	var PROTOCL = 'http://';
	var TOKENS_SERVICE = '/auth/trello';

	var saveToken = function(member,token,service) {

		console.log('saving member: service:'+service);
		console.dir(member);

		console.log('saving Token:'+token + ' service:'+service);

		var url = PROTOCL + HOST + TOKENS_SERVICE;

		console.log('url:'+url);

		var data = {
			token:token,
			serviceMemberId:member.id,
			service:service,
			display_name: $scope.user.displayName,
			id: $scope.user.id,
			email: $scope.user.email
		}

		// TBD: move to use angularJS instead of Jquery and get rid of need to change  Host when we deploy...
		$.ajax({
			type: "POST",
		  url: url,
		  data: data,
		  success: tokenSaved,
			persist:true,
			dataType:'JSON'
		});
	}

	var tokenSaved = function(data) {
		console.log('tokenSaved. data:');
		console.dir(data);
		

	
	}

	var onTrelloAuthorized = function() {

		
		var token = Trello.token();
		console.log('authorized!, trello token:'+token);
		
		// update the view since its done with Jquery :
		$scope.user.trello = token;
		//Account.setTrelloToken(token);

		
		// Send Token To App: ( TBD: secure this action )


	    Trello.members.get("me", function(member){
	        console.log('trello User fullname:'+member.fullname);
			saveToken(member,$scope.user.trello,'trello');
	    });

	};


	$scope.linkTrello = function() {
			console.log('link trello clicked');

		    Trello.authorize({
				persist:true,
				interactive:true,
				type: "popup",
		        success: onTrelloAuthorized,
		        scope: { write: true, read: true },
				expiration:'never'
		    })
    };

	$scope.unlinkTrello = function() {
			Trello.deauthorize();
    };
	

    $scope.getProfile();

  });