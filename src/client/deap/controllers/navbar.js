angular.module('MyApp')
  .controller('NavbarCtrl', function($scope,$rootScope, $auth,Account,$alert,$location,Query,GraphBuilder,Users,Pubnub) {
		Account.init(function(data) {
          $scope.user = data;
        });
		Users.init();

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
		
		switch(event.data.type) {
		    case "FeedbackNodeClicked":
				//$scope.feedbackNodeClicked(event.data.node);
				// Sanity:
				if( !event.data.node){
					console.log("event data node is undefined - exiting.")
			      	return;
				}
				$scope.$root.$broadcast("RhiziFeedbackNodeClicked", {node: event.data.node });
				
		        break;
		
		    case "RhiziNodeDoubleClicked":
				//$scope.expandNodeClicked(event.data.node);
				// Sanity:
				if( !event.data.node){
					console.log("event data node is undefined - exiting.")
			      	return;
				}
				//$scope.$root.$broadcast("ExpandNode", {node: event.data.node });
				$rootScope.$broadcast("ExpandNode",{node: event.data.node });
				
		        break;
		
			case "/graph/diff-commit-topo":
				if( !event.data.data){
					console.log("event data  is undefined - exiting.")
			      	return;
				}
				$rootScope.$broadcast("/graph/diff-commit-topo", {data: event.data.data });
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
	//	GraphBuilder.collectData();
		$rootScope.$broadcast("OrgLoadingDone",null);
		
	}
	
	
	$scope.allButtonClicked = function (event){
		console.log('angular: searchButtonClicked - navigating to searchPage.');
		$location.path('search');
		
		// push API:
	//	GraphBuilder.collectData();
		$rootScope.$broadcast("BuildAll",null);
		
	}
	

  });