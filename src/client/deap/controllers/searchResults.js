angular.module('MyApp')
  .controller('SearchResultsCtrl', function($scope,$auth,$location,Filter,Const,Account, $modal,$aside, $log,$http,Feed) {
	
		//var myAside = $aside({title: 'My Title', content: 'My Content', show: false,animation:'am-fade-and-slide-right',backdrop:false});
		 //var myAside = $aside({scope: $scope, template: '/static/deap/partials/feedPanel.html', show: false,animation:'am-fade-and-slide-right',backdrop:false})
		$scope.checked = false;
		
		// if not authenticated return to splash:
		if(!$auth.isAuthenticated()){
			$location.path('splash'); 
	    }
		
		// watch and update local feed items:
		$scope.feedItems = [{
			sender:'sender',
			action:'action',
			actionItems:'actionItems'
		}];
		
		 $scope.$watch(function () {
		    return Feed.get();
			}, 
		      function(newVal, oldVal) {
					if(newVal != oldVal){
						console.log('Feed Changed! opening feed panel: items:')
						console.dir(newVal);
						
						// TBD: open panel:
					  	//myAside.show();
					}
					
		    		$scope.feedItems = newVal;
				
		    }, true);
		
		// first thing is first listen to Rhizi orginiated events (recieved from navBar since, navBar is the Rhizi delegate (listeners are added only once in the apps lifecycle)) ) 
		$scope.$on("RhiziFeedbackNodeClicked", function (event, args) {
		   	$scope.feedbackNodeClicked(args.node);
		   
		});
		$scope.$on("RhiziExpandNodeClicked", function (event, args) {
			$scope.expandNodeClicked(args.node);
		});
		
		
		$scope.items =  {
	        targetId: 'currentD.id',
			targetName: 'currentD.name',
			targetType: 'currentD.type',
	        feedback: 'feedback',
	        description: 'description'

	    };

	  $scope.toggleFeedPanel = function(){
			//myAside.toggle();
			
			$scope.checked = !$scope.checked;
	  }


	  $scope.open = function (size) {
	    var modalInstance = $modal.open({
	      templateUrl: 'partials/myModalContent.html',
	      controller: 'ModalInstanceCtrl',
	      size: size,
	      resolve: {
	        items: function () {
	          return $scope.items;
	        }
	      }
	    });

	    modalInstance.result.then(function (selectedItem) {
	      $scope.selected = selectedItem;
	    }, function () {
	      $log.info('Modal dismissed at: ' + new Date());
	    });
	  };
		
		// TBD: move Constantsto Const service after changing css definition (colors etc) in rhizi with our naming
		var NODE_TYPE_BOARDS = 'Boards';
		var NODE_TYPE_LISTS = 'Lists';
		var NODE_TYPE_TASKS = 'Tasks';
		var NODE_TYPE_USERS = 'Users';
		
		$scope.filterData  = Filter.getData();
		
		// Rhizi delegate protocol :
		$scope.feedbackNodeClicked = function(node){
			console.log("feedbackNodeClicked, recieved from Rhizi UI. node:");
			console.dir(node);
			
			// set current node feedback data:
			$scope.items = {
			        targetId: node.id,
					targetName: node.name,
					targetType: node.type,
			        feedback: '',
			        description: ''
			}
			
			// get current node feedback data from server:
			$http.post('/feedback/get',$scope.items).
			  			success(function(data, status, headers, config) {
			    	 			$scope.items=data;
								$scope.open();
						}).
			  			error(function(data, status, headers, config) {
			    
								console.log('Feedback :get :error:'+data);
			  });
		}
		
		$scope.expandNodeClicked = function(node){
			console.log("expandNodeClicked, recieved from Rhizi UI. node:");
			console.dir(node);
			
			if(node.type == 'skill'){
				//Aggregator.getListsByBoard($scope.pushToRhizi,node.id);
			}
			if(node.type == 'person'){
				//Aggregator.getBoards($scope.pushToRhizi);
			}
		}
		
		$scope.pushToRhizi = function(input){
			console.log('pushing to rhizi:');
			console.dir(input);

			// Rhizi push API:  TBD: assign a rhizi object (not global window)
			window.push(input);
		}
		
		
		// Filter:
		$scope.filterClick = function(filter){
			var stateBeforeToggle = filter.selected;
			
			filter.selected = !filter.selected;
			Filter.setData($scope.filterData);
			
			// TBD: give  search query as parameter?
	        
			// activae aggregator API:
			switch(filter.type) {
			    case NODE_TYPE_BOARDS:
			
					if(filter.selected){
						//Aggregator.getBoards($scope.pushToRhizi);
				    }
					else{
						//Aggregator.removeBoards($scope.pushToRhizi);
						// TBD: temporary solution till implemented removeUsers:
						window.reset();
						if(Filter.usersIsActivated()){
							//Aggregator.getUsers($scope.pushToRhizi);
						}
					}
					
			        break;
			
			    case NODE_TYPE_USERS:
					if(filter.selected){
				        //Aggregator.getUsers($scope.pushToRhizi);
				    }
					else{
						//Aggregator.removeUsers($scope.pushToRhizi);
						// TBD: temporary solution till implemented removeUsers:
						window.reset();
						if(Filter.boardsIsActivated()){
						//	Aggregator.getBoards($scope.pushToRhizi);
						}
					}
			
			        break;
			    default:
			        console.log('filter unknown.');
			}

		}
  	})

	// FFEDBACK FORM Cntrl:
	.controller('ModalInstanceCtrl', function ($scope,$location, $modalInstance, items,$http,Feedback) {

		  $scope.items = items;

		  $scope.saveFeedback = function(){
			  	console.log('saving feedback:');
			  	console.dir($scope.items);
			
				var data = $scope.items;
				data.delete = false;
				return $http.post('/feedback/save', data);
		  }

		  $scope.ok = function () {
			
			$scope.saveFeedback()
		    $modalInstance.close($scope.items);
		  };

		  $scope.cancel = function () {
		    $modalInstance.dismiss('cancel');
		  };
		
		   $scope.gotoFeedbackList = function(filter){
				Feedback.setFilter(filter);
				$modalInstance.dismiss('cancel');
				$modalInstance.dismiss('cancel');
				$location.path('users'); 
				
			}
		});
		