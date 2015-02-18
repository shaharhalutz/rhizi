angular.module('MyApp')
  .controller('NavbarCtrl', function($scope, $auth,Account,$alert,$location,Query,Aggregator) {
    	Aggregator.init();
		Account.init(function(data) {
          $scope.user = data;
        });

	// Connect search Page as a Delegate to Rhizi UI:
	console.log("listening to NodeClicked events.");
	window.addEventListener("message", function(event) {
		console.log("recieved message from Rhizi:");
		
	    // We only accept messages from ourselves
	    if (event.source != window){
			console.log("event source is note window - exiting.")
	      	return;
		}
		
		// check Rhizi origin events:
		if (!event.data.type) {
			console.log("event type is undefined - exiting.")
	      	return;
		}
		
		// Sanity:
		if( !event.data.node){
			console.log("event data node is undefined - exiting.")
	      	return;
		}
		
		switch(event.data.type) {
		    case "FeedbackNodeClicked":
				//$scope.feedbackNodeClicked(event.data.node);
				
				$scope.$root.$broadcast("RhiziFeedbackNodeClicked", {node: event.data.node });
				
		        break;
		
		    case "ExpandNodeClicked":
				//$scope.expandNodeClicked(event.data.node);
				$scope.$root.$broadcast("RhiziExpandNodeClicked", {node: event.data.node });
				
		        break;
		    
			default:
		        console.log('event type unknown.');
		}
		
	}, false);


	$scope.isAuthenticated = function() {
      return $auth.isAuthenticated();
    };
	
	$scope.getProfile = function() {
      Account.getProfile()
        .success(function(data) {
          $scope.user = data;
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

	//$scope.user = {displayName:"profile"};
	//if( $auth.isAuthenticated()){
	//	$scope.getProfile()
	//}

	// Search:
	$scope.query = '';
	
	
	$scope.pushToRhizi = function(input){
		console.log('pushing to rhizi:');
		console.dir(input);

		// Rhizi push API:  TBD: assign a rhizi object (not global window)
		window.push(input);
	}
	
	$scope.searchButtonClicked = function (event){
		console.log('angular: searchButtonClicked - navigating to searchPage.');
		$location.path('search');
		
		// push API:
		Aggregator.getBoards($scope.pushToRhizi);
		Aggregator.getUsers($scope.pushToRhizi);
		
		
		/*
		Aggregator.getData( function(input) {
			console.log('pushing to rhizi:');
			console.dir(input);
			
			window.reset();
		});
		*/
	}

  });