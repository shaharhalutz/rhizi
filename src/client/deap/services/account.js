angular.module('MyApp')
	.factory('Account', function($http,$auth) {
		
		var userData;
		init();
		
		function init(callback){
				if( $auth.isAuthenticated()){
					$http.get('/api/me').
					  success(function(data, status, headers, config) {
					    // this callback will be called asynchronously
					    // when the response is available
						console.log('/api/me succeded. user Acount:');
						console.dir(data);
						//fbs = data.json_list;
						userData = data;
						if(callback){
							callback(userData);	
						}

					  }).
					  error(function(data, status, headers, config) {
					    // called asynchronously if an error occurs
					    // or server returns response with an error status.
						console.log('/api/me  failed.');
					  });
				}
			}
		
		
		
		
		
	  return {
		
		init:init,
		
	    getProfile: function() {
	      return $http.get('/api/me');
	    },
	    updateProfile: function(profileData) {
	      return $http.post('/api/updateMe', profileData);
	    },
	
		// TBD: hold all account info here to be access from all controllers not only Profile controller
		setUserData: function(data) {
			console.log('setUserData:');
			console.dir(data);
	       userData = data;
	    },
		getUserData:function(){
			return userData;
		}
	
	  };
	})
.factory('Feedback', function($http) {
	var filter;	
	var fbs;
		
	return {
		getAll: function(callback) {
			$http.get('/api/feedbacks').
			  success(function(data, status, headers, config) {
			    // this callback will be called asynchronously
			    // when the response is available
				console.log('feedbacks query succeded. feedbacks:');
				console.dir(data);
				fbs = data.json_list;
				if(callback){
					callback(fbs);	
				}
				
			  }).
			  error(function(data, status, headers, config) {
			    // called asynchronously if an error occurs
			    // or server returns response with an error status.
				console.log('feedbacks query failed.');
			  });

		    return true;
		},
		setFilter:function(fltr) {
			filter = fltr;
		},
		getFilter:function(fltr) {
			return filter;
		}
	}
})
.factory("Search", function($resource) {
  //return $resource("/api/query/:query");

  return $resource("/api/query", {}, {
    query: { method: "GET", isArray: false }
  });
})
.factory('Query', function ($http,$state) {
  var extractedHTags = [];
  var query = '';
  var hTags = []; 
  var results = [];



  return {
	setQuery: function(query) {
		console.log('execute: query:'+query);
		this.query = query;
	    //this.results = $http.post('/api/query', {'query':query});
	},
	getQuery: function() {
	 	return 	this.query;
	    //
	},
	getResults: function(callback) {
		this.results = $http.post('/api/query', {'query':this.query}).
		  success(function(data, status, headers, config) {
		    // this callback will be called asynchronously
		    // when the response is available
			console.log('query succeded.');
			callback();
		  }).
		  error(function(data, status, headers, config) {
		    // called asynchronously if an error occurs
		    // or server returns response with an error status.
			console.log('query failed.');
		  });
		 
		
	     return this.results;
		
	},
    analyzeQuery: function (query, callback) {
		this.query = query;
      // TBD: use backend module  instead ?
		// reset tags:
		 extractedHTags = [];

		
		// extract Capital starting Words from Query:
		var words = query.split(" ");
		
		var arrayLength = words.length;
		for (var i = 0; i < arrayLength; i++) {
		    var word = words[i];
		    if(word[0] && word[0] === word[0].toUpperCase()){
				extractedHTags.push({text:word});
			}
		}
		console.log('this.hTags'+this.hTags);
    },
	loadAutoComplete: function (tagQuery) {
		var words =  this.query.split(" ");
		var autocompleteValues = [];
		var arrayLength = words.length;
		for (var i = 0; i < arrayLength; i++) {
		    var word = words[i];
		 
			autocompleteValues.push(word);
			
		}
		console.log('auticomplete values:'+autocompleteValues);
		var p5 = new Promise(function(resolve, reject) { resolve(autocompleteValues) ;});
		return p5;
		
    },

	resetCTag: function () {
  		// reset tags:
		var extractedHTags = [];
    }
  };
});

;