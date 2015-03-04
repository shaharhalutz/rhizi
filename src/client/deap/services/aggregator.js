angular.module('MyApp')
	.factory('Const', function($http) {

	  return {
			NODE_TYPE_ORG:'third-internship-proposal',
	    	NODE_TYPE_BOARD:'skill',
			NODE_TYPE_PERSON:'person',
			NODE_TYPE_TASK:'interest',
			NODE_TYPE_LIST:'club',
			NODE_TYPE_CHANNEL:'dchannel',
			DEFAULT_NODE_SIZE:10
	  };

	})
	.factory('Filter', function($http) {
		var lastCommand;
		
		var filterData  = [{type:'Boards',selected:true,style:' filter-boards',styleUnselected:'filter-button'},{type:'Lists',selected:false,style:'filter-button',styleUnselected:'filter-button'},{type:'Tasks',selected:false,style:'filter-button',styleUnselected:'filter-button'},{type:'Users',selected:true,style:'filter-users',styleUnselected:'filter-button'}];
		

	  return {
		getData:function(){
			return filterData;
		},
		setData:function(data){
			
			filterData = data;
		},
		// TBD: change numbers to enum:
		boardsIsActivated: function() {
	      return filterData[0].selected;
	    },
		listsIsActivated: function() {
	      return true;
	    },
		tasksIsActivated: function() {
	      return true;
	    },
	    usersIsActivated: function() {
	      return filterData[3].selected;
	    },
	    feedbackIsActivated: function() {
	      return true;
	    }
	  };

	})

	.factory('Users', function($http,Const, $auth) {
		  
		 
		 var users
		
		
		var setUsers =	function (usersIn) {
				for (i in usersIn){
					usersIn[i].type = Const.NODE_TYPE_PERSON;
				}
				users = usersIn;
		}

		var init =	function () {
			//var users = $http.get('/api/users');
			if( $auth.isAuthenticated()){
		 		$http.get('/api/deapusers').
				  success(function(data, status, headers, config) {
				    // this callback will be called asynchronously
				    // when the response is available


						setUsers(data.json_list);
						console.log('loading Users into system.');
						console.log('users loaded:');
						console.dir(users);		  
					}).
				  error(function(data, status, headers, config) {
				    // called asynchronously if an error occurs
				    // or server returns response with an error status.
					console.log('Users:get deap Users:error:'+data);
				  });
			}
		}
		init();

		 return {
			init:init,
		   	setUsers: setUsers,
		    getUsers: function() {
		     	return users;
		   }
		 }
	})
	// recieves graph = {nodes:[],edges:[]} and formats the graph into rhizi format:
	.factory('Formatter', function($http,Const) {

		var g_format =  {"link_id_set_rm":[],"link_set_add":[{"__dst_id":"54c566132fe34f2939cb2b28","__src_id":"54b8682712ddfc5d9565be5c","__type":["working On"],"id":"54b8682712ddfc5d9565be5c54c566132fe34f2939cb2b28"},{"__dst_id":"54c566132fe34f2939cb2b28","__src_id":"54b3ad0636d8e2eec6bf02bb","__type":["working On"],"id":"54b3ad0636d8e2eec6bf02bb54c566132fe34f2939cb2b28"}],"node_id_set_rm":[],"node_set_add":[{"__label_set":["skill"],"avgFeedback":null,"description":null,"enddate":"","feedback":null,"id":"54d8692e0774266e79fee223","name":"Refactor code","startdate":"","type":"skill","url":"https://trello.com/c/KGfhD9Uv/9-refactor-code"},{"__label_set":["Person"],"avgFeedback":null,"description":null,"enddate":"","feedback":null,"id":"54b8682712ddfc5d9565be5c","name":"shaharhalutz","startdate":"","type":"person","url":"https://trello.com/shaharhalutz"},{"__label_set":["skill"],"avgFeedback":null,"description":null,"enddate":"","feedback":null,"id":"54c566132fe34f2939cb2b28","name":"Platform meeting 27-1-2015","startdate":"","type":"skill","url":"https://trello.com/c/rU6iaCZT/1-platform-meeting-27-1-2015"},{"__label_set":["Person"],"avgFeedback":null,"description":null,"enddate":"","feedback":null,"id":"54b3ad0636d8e2eec6bf02bb","name":"talserphos","startdate":"","type":"person","url":"https://trello.com/talserphos"}]}
		
		function format(grph) {
			var g_format = {link_id_set_rm:[],link_set_add:[],node_id_set_rm:[],node_set_add:[]}
			//var link_set_format = {"__dst_id":"","__src_id":"","__type":[],"id":""}
			//var node_set_format = {"__label_set":[],"description":"","enddate":"","id":"","name":"","startdate":"","type":"skill","url":""}

			// prepare links:
			var relations = grph.edges;
			var nodesDict = {};

			// go over sole nodes:
			var nodes = grph.nodes;
			for (var i = 0; i < nodes.length; i++) {
				var node = nodes[i];

				//var nodeLabels = [node.base];
				var nodeLabels = [node.type];
				var node_set_format = {__label_set:nodeLabels,
									description:node.description,
									enddate:"",
									id:node.id,
									name:node.displayName,
									startdate:"",
									type:node.type,
									url:node.url,
									feedback:node.feedback,
									avgFeedback:node.avgFeedback,
									size:node.size
									};

				g_format.node_set_add.push(node_set_format)
			}
			// go over relations:
			
			for (var i = 0; i < relations.length; i++) {

				var relation = relations[i];
				
				// prepare nodes dictionary and write on top of same node (dont hold duplicates - by id):
				nodesDict[relation.srcNode.id] = relation.srcNode;
				nodesDict[relation.trgNode.id] = relation.trgNode

				var link_set_format = {	__dst_id:relation.trgNode.id,
										__src_id:relation.srcNode.id,
										__type:[relation.relationship],
										id:relation.id}
				g_format.link_set_add.push(link_set_format);
			}
			
			return g_format;
		};

	  return {
		format:format,
	    compileGformat: function(data) {
	      return g_format;
	    }
	  };
	
	})
	.factory('GraphBuilder', function($rootScope,$http,Filter,Const,Tasks,Formatter,Channels) {
		console.log('GraphBuilder listening to Agg events');
		
		$rootScope.$on("AggOrgsReady", function (event, args) {
		   	console.log('GraphBuilder recieved AggOrgsReady event.');
			
		   	// build graph:
			var orgsGraphData = buildOrgsGraph(args);	

			publishGraphData(orgsGraphData);
		});
		
		$rootScope.$on("AggBoardsReady", function (event, args) {
		   	console.log('GraphBuilder recieved AggBoardsReady event.');
			
		   	// build graph:
			var boardsGraphData = buildBoardsGraph(args);	

			publishGraphData(boardsGraphData);
		});
		
		$rootScope.$on("AggListsReady", function (event, args) {
		   	console.log('GraphBuilder recieved AggListsReady event.');
			
		   	// build graph:
			var listsGraphData = buildListsGraph(args);	
		
			publishGraphData(listsGraphData);
		});
		
		$rootScope.$on("AggTasksReady", function (event, args) {
		   	console.log('GraphBuilder recieved AggTasksReady event.');
			
		   	// build graph:  TBD:
			var tasksGraphData = buildTasksGraph(args);	
		
			publishGraphData(tasksGraphData);
			
			onDoneCollectingServicesData();
		});
		
		
		
		$rootScope.$on("AggChannelMembersReady", function (event, args) {
		   	console.log('GraphBuilder recieved AggChannelMembersReady event.');
			
		   	// build graph:  TBD:
			var tasksGraphData = buildChannelMembersGraph(args);	
		
			publishGraphData(tasksGraphData);
			
		
		});
		
		function onDoneCollectingServicesData() {
			loadFromRhizi();
		}
		
		function loadFromRhizi(){
			window.load();
		}

		function publishGraphData(graphData) {
			console.log('GraphBuilder: publishGraphData : completed cycle - graphData:');
			console.dir(graphData);
			
			// TBD: fill in Feedback on all nodes ?
			//getNodesFeedback(boardsGraphData);
			
			var payload = Formatter.format(graphData);
			console.dir(payload);
			
			
			window.push(payload);
		};
		
		function buildUsersGraph(users){
			var graph = {	nodes:users,
							edges:[]
						}
			return graph;					
		}
		
		
		
		function buildTaskMembersGraph(task){
			var graph = {	nodes:[],
							edges:[]
						}
						
			memberNodesDict ={};		
			for (memberId in task.members) {	
				var member = task.members[memberId];
				memberNodesDict[member.id] = member;
		
				// TBD: implement : resourceTypeToRelationship(task['type'])
				var edge = {	srcNode:member,
								relationship: 'member' ,
								trgNode: task,
								 id:(''+(member.id)+'__'+task.id)
							}
		
				graph.edges.push(edge);
			}	
			
	
			// add members to nodes list:
			// nodes: add member nodes from memberNodeDict 
			for (var property in memberNodesDict) {
			    if (memberNodesDict.hasOwnProperty(property)) {
					// collect nodes:
					graph.nodes.push(memberNodesDict[property]);
			    }
			}
			console.log('buildTaskMembersGraph:');
			console.dir(graph);
			
			return graph;
		}
	
		function buildListTasksGraph(list){
			var graph = {	nodes:[],
							edges:[]
						}
						

			// add boards as nodes:
			graph.nodes.push(list);
		
			for (taskId in list.tasks) {
				var task = list.tasks[taskId];
			
			
				// TBD: implement : resourceTypeToRelationship(task['type'])
				var edge = {	srcNode:list,
								relationship: 'contains' ,
								trgNode: task,
								 id:(''+(list.id)+'__'+task.id)
							}
		
				graph.edges.push(edge);
				graph.nodes.push(task);
				
				// add task members subgraph:
				var subGraph = buildTaskMembersGraph(task);
				
				// merge subGraph:
				for (nodeIndx in subGraph.nodes){
					graph.nodes.push(subGraph.nodes[nodeIndx]);
				}
				for (edgeIndx in subGraph.edges){
					graph.edges.push(subGraph.edges[edgeIndx]);
				}
			}
			return graph;
		}
		
		function buildTasksGraph(boards){
			boardFilterOverride = true;
			
			var graph = {	nodes:[],
							edges:[]
						}
							
			// go over boards:
			for (boardId in boards) {
				
				var board = boards[boardId];
				
				// go over lists:	
				for (listId in board.lists) {
					var list =  board.lists[listId];
					var subGraph = buildListTasksGraph(list);
					
					// merge subGraph:
					for (nodeIndx in subGraph.nodes){
						graph.nodes.push(subGraph.nodes[nodeIndx]);
					}
					for (edgeIndx in subGraph.edges){
						graph.edges.push(subGraph.edges[edgeIndx]);
					}
				}
			}
			
			return graph;
		}
		
		function buildListsGraph(boards,boardFilterOverride){
			boardFilterOverride = true;
			
			var graph = {	nodes:[],
							edges:[]
						}
							
			// go over boards
			//if(boardFilterOverride || Filter.boardsIsActivated()){
				
				for (boardId in boards) {
					
					var board = boards[boardId];
					
					// add boards as nodes:
					graph.nodes.push(board);
					
					for (listId in board.lists) {
						var list = board.lists[listId];
						list.size = listSizeMatric(list);
						
						
						// TBD: implement : resourceTypeToRelationship(task['type'])
						var edge = {	srcNode:board,
										relationship: 'contains' ,
										trgNode: list,
										 id:(''+(board.id)+'__'+list.id)
									}
					
						graph.edges.push(edge);
						graph.nodes.push(list);
					}
				}
			//}
			return graph;
		}
		

		function listSizeMatric(list){
			return  Const.DEFAULT_NODE_SIZE+ list.tasksCount;
		}
		
		function boardSizeMatric(board){
			return  Const.DEFAULT_NODE_SIZE+ board.tasksCount;
		}
		
		// TBD: if Filter jus activatd getUsers in GraphBuilder get existing model from RhiziModel service and conect tasks, lists, boards their members  which just 'arrived' 
		function buildBoardsGraph(orgs,listsData,tasksData){
			console.log('buildBoardsGraph orgs:');
			console.dir(orgs);
			var graph = {	nodes:[],
							edges:[]
						}
						
			for (orgId in orgs) {

				var org = orgs[orgId];

				// add boards as nodes:
				graph.nodes.push(org);
				
				for (boardId in org.boards) {
					var board = org.boards[boardId];
					board.size = boardSizeMatric(board);

					// TBD: implement : resourceTypeToRelationship(task['type'])
					var edge = {	srcNode:org,
									relationship: 'contains' ,
									trgNode: board,
									 id:(''+(org.id)+'__'+board.id)
								}

					graph.edges.push(edge);
					graph.nodes.push(board);
				}
			
			}
			return graph;
		}


		/*
		// if Filer-users is not checked , no need to add  User edges nor User nodes:
		//if(Filter.usersIsActivated()){
			memberNodesDict ={};		
			for (var i = 0; i < boardsList.length; i++) {
				var currentBoard = boardsList[i];
				for (var j = 0; j < currentBoard.members.length; j++) {	
					var member = currentBoard.members[j];
					memberNodesDict[member.id] = member;
			
					// TBD: implement : resourceTypeToRelationship(task['type'])
					var edge = {	srcNode:member,
									relationship: 'member' ,
									trgNode: currentBoard,
									 id:(''+(member.id)+'__'+currentBoard.id)
								}
			
					graph.edges.push(edge);
				}	
			}
	
			// add members to nodes list:
			// nodes: add member nodes from memberNodeDict 
			for (var property in memberNodesDict) {
			    if (memberNodesDict.hasOwnProperty(property)) {
					// collect nodes:
					graph.nodes.push(memberNodesDict[property]);
			    }
			}
		//}
		*/		
		
		// TBD: if Filter jus activatd getUsers in GraphBuilder get existing model from RhiziModel service and conect tasks, lists, boards their members  which just 'arrived' 
		function buildOrgsGraph(orgs,listsData,tasksData){
			console.log('buildOrgsGraph orgs:');
			console.dir(orgs);
			var graph = {	nodes:[],
							edges:[]
						}
		
				// convert Boards:	
				var orgsList = [];
				for (orgId in orgs){
					orgsList.push(orgs[orgId]);
				}
			
						
				graph.nodes = orgsList;
			
				/*
				// if Filer-users is not checked , no need to add  User edges nor User nodes:
				//if(Filter.usersIsActivated()){
					memberNodesDict ={};		
					for (var i = 0; i < boardsList.length; i++) {
						var currentBoard = boardsList[i];
						for (var j = 0; j < currentBoard.members.length; j++) {	
							var member = currentBoard.members[j];
							memberNodesDict[member.id] = member;
					
							// TBD: implement : resourceTypeToRelationship(task['type'])
							var edge = {	srcNode:member,
											relationship: 'member' ,
											trgNode: currentBoard,
											 id:(''+(member.id)+'__'+currentBoard.id)
										}
					
							graph.edges.push(edge);
						}	
					}
			
					// add members to nodes list:
					// nodes: add member nodes from memberNodeDict 
					for (var property in memberNodesDict) {
					    if (memberNodesDict.hasOwnProperty(property)) {
							// collect nodes:
							graph.nodes.push(memberNodesDict[property]);
					    }
					}
				//}
				*/
			
			return graph;
		}
		
		/*
		function buildChannelsGraph(boards){
			boardFilterOverride = true;
			
			var graph = {	nodes:[],
							edges:[]
						}
							
			// go over boards
			//if(boardFilterOverride || Filter.boardsIsActivated()){
				
				for (boardId in boards) {
					
					var board = boards[boardId];
					
					// add boards as nodes:
					graph.nodes.push(board);
					
					for (listId in board.lists) {
						var list = board.lists[listId];
						
						
						// TBD: implement : resourceTypeToRelationship(task['type'])
						var edge = {	srcNode:board,
										relationship: 'contains' ,
										trgNode: list,
										 id:(''+(board.id)+'__'+list.id)
									}
					
						graph.edges.push(edge);
						graph.nodes.push(list);
					}
				}
			//}
			return graph;
		}
		*/
		
		function buildChannelMembersGraph(boards){
			
			var graph = {	nodes:[],
							edges:[]
						}
							
			// go over boards
			//if(boardFilterOverride || Filter.boardsIsActivated()){
				
				for (boardId in boards) {
					
					var board = boards[boardId];
					
					// add boards as nodes:
					graph.nodes.push(board);
					
					for (listId in board.members) {
						var list = board.members[listId];
						
						
						// TBD: implement : resourceTypeToRelationship(task['type'])
						var edge = {	srcNode:board,
										relationship: 'contains' ,
										trgNode: list,
										 id:(''+(board.id)+'__'+list.id)
									}
					
						graph.edges.push(edge);
						graph.nodes.push(list);
					}
				}
			//}
			return graph;
		}
		
		
		function collectData(){
			Tasks.collectData();
			Channels.collectData();
		}

		 return {
			collectData:collectData,
		   	buildBoardsGraph:buildBoardsGraph,
			buildUsersGraph:buildUsersGraph,
			buildListsGraph:buildListsGraph
		 }
	})

	.factory('Tasks', function($rootScope,$http,Filter,Account,Const,Users) {
		Users.init();
		var orgName = 'lazooznew';
		var token = undefined;
		var onBoardsReadyCB;
		var onListsReadyCB;
		
		// data state:
		var boardData = {id:'',displayName:'dummy',lists:[],type:Const.NODE_TYPE_BOARD}; 
		var boards;
		var users;
		var orgs;
	
	
		// Request Info:
		var HOST = 'api.trello.com';
		var PROTOCL = 'https://';
		
		
		
		function getTasks(boards,onSuccess,onError) {
			
			for (var bId in boards){
				getTasksByBoardId(bId,onSuccess,onError);
			}
		};
		
		
		function getTasksByBoardId(boardId,onSuccess,onError) {
			console.log('getTasksByBoardId:'+boardId);
			
			// set state:
			onListsReadyCB = onSuccess;
			
			var TOKENS_SERVICE = '/1/boards/'+boardId+'/cards';
			var url = PROTOCL + HOST + TOKENS_SERVICE;
			var token = Account.getUserData().trello;
			var key = 'c1bb14ae5cc544231959fc6e9af43218';
			var params = {
				token:token,
				key:key
			}
		
			// TBD: move to use angularJS instead of Jquery and get rid of need to change  Host when we deploy...
			// TBD: which API ? do we get 'my borads or boards of orgenziation'
			$.ajax({
				type: "GET",
			  url: url,
			  data: params,
			  success: onSuccess,
				persist:true,
				dataType:'JSON'
			});
		}
		
		function parseTasks(tasksResult) {
			console.log('reveiced tasksResult:');
			console.log(tasksResult);
			
			if(!tasksResult.length){
				return null;
			}
			
			var boardId;
			var org
			// parse and fill in lists with tasks Data:
			for (var i = 0; i < tasksResult.length; i++) {
	
			    var taskRes = tasksResult[i];			
				var task  = {id:taskRes.id,displayName:taskRes.name,type:Const.NODE_TYPE_TASK,members:{},url:taskRes.url};
				
				// attach members to task :   idMembers
				// get board members:
				var members =  taskRes.idMembers;
				for (var j = 0; j < members.length; j++) {
					var memberId = members[j];
					var member = {id:memberId,displayName:"None Deap User",type:Const.NODE_TYPE_PERSON};
					
					// change User Ids to Deap Ids on User Nodes:
					normelizedUser = normelizeUserNode(member);
					
					if(!normelizedUser){
						// if user not registereed in deap use as non register member:
						normelizedUser = member;
						
						// TBD: should we show non deap members ?
						//newBoard.members.push(normelizedUser);
					}
					
					task.members[memberId]=(normelizedUser);
					
				}
				
				// get current board's list to attach task to:
				org = getOrgByBoardId(taskRes.idBoard) ;
				boardId = taskRes.idBoard;
				var board = org.boards[taskRes.idBoard];
				var list = board.lists[taskRes.idList];
				
				// update tasks count:
				board.tasksCount = board.tasksCount +1;

				list.tasks[taskRes.id] = task;
				list.tasksCount = list.tasksCount +1;
			}
			
			// publish:	
			console.log('finished parsing tasks: added task to board lists, board:');
			console.dir(org.boards[boardId]);
			return org.boards[boardId];	
		}
		
		
		
		function getLists(boards,onSuccess,onError) {
			
			for (boardId in boards){
				getListsByBoardId(boardId,onSuccess,onError);
			}
		};
		
		
		function getListsByBoardId(boardId,onSuccess,onError) {
			console.log('getListsByBoardId:'+boardId);
			// set state:
			onListsReadyCB = onSuccess;
			
			var TOKENS_SERVICE = '/1/boards/'+boardId+'/lists';
			var url = PROTOCL + HOST + TOKENS_SERVICE;
			var token = Account.getUserData().trello;
			var key = 'c1bb14ae5cc544231959fc6e9af43218';
			var params = {
				token:token,
				key:key
			}
			console.dir(params);
			
			// TBD: move to use angularJS instead of Jquery and get rid of need to change  Host when we deploy...
			// TBD: which API ? do we get 'my borads or boards of orgenziation'
			$.ajax({
				type: "GET",
			  url: url,
			  data: params,
			  success: onSuccess,
				persist:true,
				dataType:'JSON'
			});
		}
		
		function getOrgByBoardId(boardId) {
			for (orgId in orgs){
				var currentOrg = orgs[orgId];
				for (boardId in currentOrg.boards){
					var currentBoard = currentOrg.boards[boardId];
					if(boardId == currentBoard.id){
						return currentOrg;
					}
				}
			}
			console.log('error : couldnt getOrgByBoardId: '+boardId);
			return null;
		};

		
		function parseLists(listsResult) {
			console.log('reveiced listsResult:');
			console.log(listsResult);
			if(!listsResult.length){
				return {};
			}
			
			//var board = {id:'',displayName:'dummy',lists:[],type:Const.NODE_TYPE_BOARD}; 
			
			var boardId
			var org
			// parse and fill in listsData:
			for (var i = 0; i < listsResult.length; i++) {
	
			    var listRes = listsResult[i];
				
				// get org bi boardId:
				org = getOrgByBoardId(listRes.idBoard);
				if(!org) {
					return {}
				}
				
				// get current board Id:
				var board = org.boards[listRes.idBoard];
				boardId = listRes.idBoard;
				//var newList = {id:listRes.id,displayName:listRes.name,type:Const.NODE_TYPE_LIST} ;
				if(board){
					board.lists[listRes.id] = ({id:listRes.id,displayName:listRes.name,type:Const.NODE_TYPE_LIST,tasks:{},url:listRes.url,tasksCount:0});
				}
			}
			
			// publish:	
			console.log('finished parsing lists: added lists to board:');
			console.dir( org.boards[boardId]);
			return  org.boards[boardId];	
		}
		
		
		function getBoards(orgs,onSuccess,onError) {
			for (orgId in orgs){
				
				// TBD: load all orgs:
				if(orgs[orgId].displayName == 'lazooznew'){
					continue;
				}
				
				
				getBoardsByOrgId(orgId,onSuccess,onError);
			}
		}
		
		function getBoardsByOrgId(orgId,onSuccess,onError) {
			
			onBoardsReadyCB = onSuccess;
			
			var TOKENS_SERVICE = '/1/organizations/'+orgId+'/boards';

			var url = PROTOCL + HOST + TOKENS_SERVICE;
			console.log('url:'+url);

			var token = Account.getUserData().trello;
			var key = 'c1bb14ae5cc544231959fc6e9af43218';
			var data = {
				token:token,
				key:key
			}

			// TBD: move to use angularJS instead of Jquery and get rid of need to change  Host when we deploy...
			// TBD: which API ? do we get 'my borads or boards of orgenziation'
			$.ajax({
				type: "GET",
			  url: url,
			  data: data,
			  success: onSuccess,
				persist:true,
				dataType:'JSON'
			});
			
	    };

		function parseBoards(boardsResult) {
			console.log('parseBoards: trello boardsResult:');
			console.dir(boardsResult);
			
		    //boards = {};
								
			// parse and fill in boardsData:
			for (var i = 0; i < boardsResult.length; i++) {
			    var boardRes = boardsResult[i];
				var newBoard = {id:boardRes.id,orgId:boardRes.idOrganization,displayName:boardRes.name,members:[],type:Const.NODE_TYPE_BOARD,lists:{},url:boardRes.url,tasksCount:0} 
				
				// get board members:
				var members = boardRes.memberships;
				for (var j = 0; j < members.length; j++) {
					var memberRes = members[j];
					var member = {id:memberRes.idMember,displayName:"None Deap User",type:Const.NODE_TYPE_PERSON};
					
					// change User Ids to Deap Ids on User Nodes:
					normelizedUser = normelizeUserNode(member);
					
					if(!normelizedUser){
						// if user not registereed in deap use as non register member:
						normelizedUser = member;
						
						// TBD: should we show non deap members ?
						//newBoard.members.push(normelizedUser);
					}
	
					newBoard.members.push(normelizedUser);
					
					// assign to global org:
					var currentOrg = orgs[boardRes.idOrganization];
					currentOrg.boards[boardRes.id] = newBoard;
				}
				
				//boards.push(newBoard);
				//boards[newBoard.id]=newBoard;
				
				
				
			}
			return currentOrg;
			// publish:
			//onBoardsReadyCB(boards);
	    };
	
	
		function getOrgs(onSuccess,onError) {
			
			onBoardsReadyCB = onSuccess;
			
			//var org = orgs[0];
			var TOKENS_SERVICE = '/1/members/' + Account.getUserData().trelloId + '/organizations';

			var url = PROTOCL + HOST + TOKENS_SERVICE;
			console.log('url:'+url);

			var token = Account.getUserData().trello;
			var key = 'c1bb14ae5cc544231959fc6e9af43218';
			var data = {
				token:token,
				key:key
			}

			// TBD: move to use angularJS instead of Jquery and get rid of need to change  Host when we deploy...
			// TBD: which API ? do we get 'my borads or boards of orgenziation'
			$.ajax({
				type: "GET",
			  url: url,
			  data: data,
			  success: onSuccess,
				persist:true,
				dataType:'JSON'
			});
			
	    };
	
		function parseOrgs(orgsResult) {
			console.log('parseBoards: trello orgsResult:');
			console.dir(orgsResult);
			
		    orgs = {};
								
			// parse and fill in boardsData:
			for (var i = 0; i < orgsResult.length; i++) {
			    var orgRes = orgsResult[i];
				var newOrg = {id:orgRes.id,displayName:orgRes.name,members:[],type:Const.NODE_TYPE_ORG,boards:{},url:orgRes.url} 
				
				// get board members:
				var members = orgRes.memberships;
				for (var j = 0; j < members.length; j++) {
					var memberRes = members[j];
					var member = {id:memberRes.idMember,displayName:"None Deap User",type:Const.NODE_TYPE_PERSON};
					
					// change User Ids to Deap Ids on User Nodes:
					normelizedUser = normelizeUserNode(member);
					
					if(!normelizedUser){
						// if user not registereed in deap use as non register member:
						normelizedUser = member;
						
						// TBD: should we show non deap members ?
						//newBoard.members.push(normelizedUser);
					}
	
					newOrg.members.push(normelizedUser);
					
				}
				
				//boards.push(newBoard);
				orgs[newOrg.id]=newOrg;
			}
			return orgs;
			// publish:
			//onBoardsReadyCB(boards);
	    };
	
	
	
	
		// change User Ids to Deap Ids on User Nodes:
		function normelizeUserNode(member) {
			var serviceIdField = getServiceIdField();
			// go over Person type nodes: and get users (by taskService('trello') Id) from Users services info and change id on User nodes to be the Deap Id and not service specific.
			usersAr = Users.getUsers();
			// translate serviceIds to DeapIds and assign displayName:
			for (i in usersAr){
				var user = usersAr[i];
				if(user[serviceIdField] == member.id){
			  	
					member.displayName = user.displayName;
					member.id = user.id;
					return member;
				}
				
			}
	
			return null;
		}
	
		function boardsFailed(error) {
			console.log('Error, Failed to get Trello Boards for '+orgName);
	    };
	
	
		function getServiceIdField() {
			return 'trelloId'
	    };

		function onDataReady(data) {
			console.log('onDataReady: data.type:'+data.type);
			console.dir(data);

			switch(data.type) {

				case "users":
					users = data.users;
					$rootScope.$broadcast("AggUsersReady",users);

					// next in line: get Boards (start chain : boards,lists,tasks ..)
					getOrgs( function(orgns){
										//onDataReady({type:'boards',boards:boards});
										orgs = parseOrgs(orgns);
										onDataReady({type:'orgs',orgs:orgs});
										
									 },
									 function(error){
										onDataFail({type:'orgs',error:error});
					});
		
			        break;

				case "orgs":
					orgs = data.orgs;
					$rootScope.$broadcast("AggOrgsReady",orgs);

					// next in line: get Boards (start chain : boards,lists,tasks ..)
					//var orgs = ['backfeed'];
					getBoards( orgs,function(boards){
										//onDataReady({type:'boards',boards:boards});
										onDataReady({type:'boards',org:parseBoards(boards)});

									 },
									 function(error){
										onDataFail({type:'boards',error:error});
					});

			        break;

			    case "boards":
	
					var orgId = data.org.id;
					orgs[data.org.id] = data.org
					orgs[data.org.id].boards = data.org.boards;
					
					var orgToSend = {}
					orgToSend[(''+orgId)] = orgs[orgId];
					
					$rootScope.$broadcast("AggBoardsReady", orgToSend);
			
					// TBD: only activate lists fetching after all this board's lists have arrived ... 
					//var temporgs = {}
					//temporgs[orgId] = currentOrg;
			
					// get lsts:

					getLists(	data.org.boards 	,function(lists){
										onDataReady({type:'lists',board:parseLists(lists)});
									},
									function(error){
										onDataFail({type:'lists',error:error});
					});
			
			
			
		

			        break;

			    case "lists":
					if(!data.board || !data.board.lists || data.board.lists == {}){
					
						console.log('recieed board with empty lists.');
							break;
					}
					// TEMP:  TBD: remove
					//break;
			
					var currentBoard = orgs[data.board.orgId].boards[data.board.id];
					currentBoard.lists = data.board.lists;
					var boardId = currentBoard.id;
					$rootScope.$broadcast("AggListsReady", {boardId:currentBoard});
			
					// TBD: only activate task fetching after all this board's lists have arrived ... 
					var tempBoards = {}
					tempBoards[boardId] = currentBoard;
					getTasks(tempBoards,	function(tasks){
										onDataReady({type:'tasks',board:parseTasks(tasks)})
									},
									function(error){
										onDataFail({type:'tasks',error:error})
					});
					
					
			        break;
			
				case "tasks":
				    if(!data.board){
						break;
					}
					var boardId = data.board.id; 
					
					var org = getOrgByBoardId(boardId);
					
					orgs[org.id].boards[data.board.id] = data.board;
					$rootScope.$broadcast("AggTasksReady",{boardId:orgs[org.id].boards[data.board.id]} );

				    break;
				default:
			        console.log('event type unknown.');
			}
		};

		function onDataFail(data) {
			console.log('onDataFail: error :  for data.type:'+data.type);

		};

		function collectData() {
			onDataReady({type:'users',users:Users.getUsers()})
		};
	
		return {
			collectData:collectData,
			getServiceIdField:getServiceIdField,
		    getBoards: getBoards,
			getListsByBoardId:getListsByBoardId
		};
	
	})
	
	
	.factory('Channels', function($rootScope,$http,Users,Account,Const) {
		// Request Info:
		var HOST = 'slack.com';
		var PROTOCL = 'https://';
		
		var channels ={}
		
		
		function onDataReady(data) {
			console.log('onDataReady: data.type:'+data.type);
			console.dir(data);

			switch(data.type) {

				case "users":
					users = data.users;
					//$rootScope.$broadcast("AggChannelsReady",users);

					// next in line: get channels 
					getChannels( function(data){
										//onDataReady({type:'boards',boards:boards});
										
										onDataReady({type:'channels',channels:parseChannels(data)});
										
									 },
									 function(error){
										onDataFail({type:'channels',error:error});
					});
		
			        break;

				case "channels":
					channels = data.channels;
					$rootScope.$broadcast("AggChannelsReady",channels);

					for (chnId in channels){
						getMembersByChannelId(chnId,
							function(members){
								onDataReady({type:'members',channels:parseChannelMembers(members)});
							},
					 		function(error){
								onDataFail({type:'members',error:error});
						});
					}

			        break;
		
				case "members":
					channels = data.channels;
					$rootScope.$broadcast("AggChannelMembersReady",channels);


			        break;
				default:
			        console.log('event type unknown.');
			}
		};
		
		function parseChannelMembers(data) {
			console.log('parseChannelMembers:');
			console.dir(data);
			
			var chnl = data.channel;
			var membersRes = chnl.members;
			
			for (memberIndx in membersRes){
				var memberId = membersRes[memberIndx];
				var member = {id:memberId,displayName:"None Deap User",type:Const.NODE_TYPE_PERSON};
					
				// change User Ids to Deap Ids on User Nodes:
				normelizedUser = normelizeUserNode(member);				
				channels[chnl.id].members[member.id] = member;
			}
			return channels;
			
		}
		
		function parseChannels(data) {
			var chnls = data.channels;
			for (chnIndx in chnls){
				var chnl = chnls[chnIndx];				
				channels[chnl.id] = { id: chnl.id, displayName: chnl.name,type:Const.NODE_TYPE_CHANNEL,members:{}}
			}
			return channels;
		}
		
		function getMembersByChannelId(chnId,onSuccess,onFail) {
			
			onBoardsReadyCB = onSuccess;
			// https://slack.com/api/channels.info
			var TOKENS_SERVICE = '/api/channels.info';

			var url = PROTOCL + HOST + TOKENS_SERVICE;
			console.log('url:'+url);

			var token = Account.getUserData().slackToken;
		//	var key = 'c1bb14ae5cc544231959fc6e9af43218';
			var data = {
				token:token,
				channel:chnId
			}

			// TBD: move to use angularJS instead of Jquery and get rid of need to change  Host when we deploy...
			// TBD: which API ? do we get 'my borads or boards of orgenziation'
			$.ajax({
				type: "GET",
			  url: url,
			  data: data,
			  success: onSuccess,
				persist:true,
				dataType:'JSON'
			});
		}
		
		// change User Ids to Deap Ids on User Nodes:
		function normelizeUserNode(member) {
			var serviceIdField = getServiceIdField();
			// go over Person type nodes: and get users (by taskService('trello') Id) from Users services info and change id on User nodes to be the Deap Id and not service specific.
			usersAr = Users.getUsers();
			// translate serviceIds to DeapIds and assign displayName:
			for (i in usersAr){
				var user = usersAr[i];
				if(user[serviceIdField] == member.id){
			  	
					member.displayName = user.displayName;
					member.id = user.id;
					return member;
				}
				
			}
	
			return null;
		}
	
		function getServiceIdField() {
			return 'slack'
	    };
		
		
		
		function getChannels(onSuccess,onError) {
			
			onBoardsReadyCB = onSuccess;
			// 'https://slack.com/api/users.list'
			var TOKENS_SERVICE = '/api/channels.list';

			var url = PROTOCL + HOST + TOKENS_SERVICE;
			console.log('url:'+url);

			var token = Account.getUserData().slackToken;
		//	var key = 'c1bb14ae5cc544231959fc6e9af43218';
			var data = {
				token:token
				//,key:key
			}

			// TBD: move to use angularJS instead of Jquery and get rid of need to change  Host when we deploy...
			// TBD: which API ? do we get 'my borads or boards of orgenziation'
			$.ajax({
				type: "GET",
			  url: url,
			  data: data,
			  success: onSuccess,
				persist:true,
				dataType:'JSON'
			});
	    };
	
		function collectData() {
			onDataReady({type:'users',users:Users.getUsers()})
		};
	
		return {
			collectData:collectData,
			getServiceIdField:getServiceIdField,
		    getChannels: getChannels
		};
	
	});