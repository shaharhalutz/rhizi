angular.module('MyApp')
.factory('Pubnub', function($rootScope,Formatter,Account,Feed) {
	console.log('Pubnub listening to Rhizi events.');
	
	// init:
	var PUBNUB_rhizi = PUBNUB.init({
	    publish_key: 'pub-c-abb7c521-df6b-4b75-aff0-7176d6bf309c',
	    subscribe_key: 'sub-c-86a1b2a0-bc50-11e4-9f29-0619f8945a4f'
	});
	
	// Subscribe to the Rhizi channel
	PUBNUB_rhizi.subscribe({
	  channel: 'rhizi',
	  message: function(m){
			
			console.log('PUBNUB_rhizi: recieved message on rhizi channel:');
			console.dir(m);
			var obj = JSON.parse(m.data);
			
			
			// push to Rhizi:
			window.push(obj['topo_diff']);
			
			// push to feed:
			Feed.push(m);
			
	   }
	});
	
	
	$rootScope.$on("/graph/diff-commit-topo", function (event, data) {
	   	console.log('Pubnub recieved Rhizi event: /graph/diff-commit-topo ');
		
		// publish:
		broadcast(data);
	});
	
	function broadcast(data){
		console.log('Pubnub, broadcasting:');
		//console.dir(data);
		data.sender = Account.getUserData().displayName;
		
		PUBNUB_rhizi.publish({
		    channel: 'rhizi',
		    message: data
		 });		
	}
	
	function subscribe(channel,cb){
		console.log('Pubnub, subscribe:');
			// Subscribe to the Rhizi channel
			PUBNUB_rhizi.subscribe({
			  channel: channel,
			  message: cb
			});
	}
	
	 return {
		broadcast:broadcast,
	   	subscribe:subscribe
	 }
})

.factory('Feed', function($rootScope,Formatter) {

	var list = [];
	
	// Subscribe to the Rhizi channel
	/*
	Pubnub.subscribe('rhizi' ,function(m){
			
			console.log('Feed: recieved message on rhizi channel:');
			console.dir(m);
			var obj = JSON.parse(m.data);
			
			// prepare item
			var feedItem = prepareFeedItem(obj);
			feedItem.sender = m.sender;
			
			
			if($rootScope.$root.$$phase != '$apply' && $rootScope.$root.$$phase != '$digest'){
			   $rootScope.$apply(function() {
			     	// push to feed:
					list.push(feedItem);
			   });
			 }
			 else {
			   		// push to feed:
					
					list.push(feedItem);
			  }
			
	   
	});
	*/
	

	function prepareFeedItem(rhiziObj){
		// "node_set_add":[{"name":"newNode","id":"t9rzcjvb","__label_set":["Skill"]}]
		
		// set :
		var set = rhiziObj['topo_diff'];
		var sender = rhiziObj.sender;
		var actionItems = '';
		var action = ' added ';
		for (nodeSetIndx in set.node_set_add){
			var currentNode = set.node_set_add[nodeSetIndx];
			actionItems = actionItems + currentNode.name+"  ,"
		}
		var feedItem = {
			sender:sender,
			action:action,
			actionItems:actionItems
		}
		
		return feedItem;
	}

	function push(m){
		// pushing Item to Feed:
		console.log('pushing Item to Feed:');
		console.dir(m);

		var obj = JSON.parse(m.data);
		
		// prepare item
		var feedItem = prepareFeedItem(obj);
		feedItem.sender = m.sender;
		
		
		if($rootScope.$root.$$phase != '$apply' && $rootScope.$root.$$phase != '$digest'){
		   $rootScope.$apply(function() {
		     	// push to feed:
				list.push(feedItem);
		   });
		 }
		 else {
		   		// push to feed:
				
				list.push(feedItem);
		  }
		
		
		
	}
	
	function get(){
		return list;
	}


	 return {
		push:push,
		get:get
	   	
	 }
});
	