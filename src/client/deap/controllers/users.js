angular.module('MyApp')
  .controller('UsersCtrl', function($scope,$auth,$location,Feedback) {
	
	// if not authenticated return to splash:
	if(!$auth.isAuthenticated()){
		$location.path('splash'); 
    }

	Feedback.getAll(function(data){
		$scope.feedbacks = data;
		
	});
	
	$scope.searchText = Feedback.getFilter();

	/*
	$scope.slackUsers = Feedback.getUsers();
	console.log('$scope.slackUsers:')
	console.dir($scope.slackUsers)
	
	$scope.users = [{
						realName:'shahar halutz',
						email:'myemail',
						rep:'90',
						activated:true,
						avatar:"https:\/\/secure.gravatar.com\/avatar\/03fd4d2ade5296050301cf22ef3c639c.jpg"
					},
					{
						realName:'yosi ofi',
						email:'myemail2',
						rep:'30',
						activated:false,
						avatar:"https:\/\/secure.gravatar.com\/avatar\/03fd4d2ade5296050301cf22ef3c639c.jpg"
					},
					{
						realName:'schelich levo',
						email:'myemail3',
						rep:'40',
						activated:true,
						avatar:"https:\/\/secure.gravatar.com\/avatar\/03fd4d2ade5296050301cf22ef3c639c.jpg"
					}
	]
	
	//$scope.users = User.query();
	*/
  	$scope.orderProp = "targetName"; // set initial order criteria
	
});