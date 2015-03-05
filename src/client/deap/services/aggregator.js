angular.module('MyApp')
	.factory('Const', function($http) {

	  return {
			NODE_TYPE_ORG:'third-internship-proposal',
	    	NODE_TYPE_BOARD:'skill',
			NODE_TYPE_PERSON:'person',
			NODE_TYPE_TASK:'interest',
			NODE_TYPE_LIST:'club',
			NODE_TYPE_CHANNEL:'dchannel',
			DEFAULT_NODE_SIZE:7
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
				var size = 0;
				if(node.size){
					console.log('node.size:'+node.size);
					size = node.size;
				}
				
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
			
		   	// attach orgs :  // TBD: org size will be calulated only when data loading is separated (since size is dependant till all tasks have been loaded)
			var orgsGraphData;
			var orgs = args;
			for (orgId in orgs){
				var org = orgs[orgId];
				org.size = orgSizeMatric(org);
				var graph = {	nodes:[],
								edges:[]}
				addNode(graph,org);
				publishGraphData(graph);
			}	
		});
				
		$rootScope.$on("AggChannelMembersReady", function (event, args) {
		   	console.log('GraphBuilder recieved AggChannelMembersReady event.');
			var graph = {	nodes:[],
							edges:[] }
			var channels = args;
			for (chnId in channels){
				var channel = channels[chnId];
				channel.size = channelSizeMatric(channel);
				addNode(graph,channel);
				buildSubGroup(graph,channel,'members');
			}
			publishGraphData(graph);
			
		});
		
		$rootScope.$on("BoardLoadingDone", function (event, args) {
		   	console.log('GraphBuilder recieved BoardLoadingDone event.');
			
			var graph = {	nodes:[],
							edges:[]
						}
						
			var orgs = args.orgs;
			var orgToAttachTo = orgs[args.boardDoneLoading.orgId];
			var boardToBuild = args.boardDoneLoading;
			
			// attach board:
			boardToBuild.size = boardSizeMatric(boardToBuild);
			attachNodeTo(graph,boardToBuild,orgToAttachTo);

			for (listId in boardToBuild.lists){
				// attach list:
				var list = boardToBuild.lists[listId];
				list.size = listSizeMatric(list);
				attachNodeTo(graph,list,boardToBuild);
				for (taskId in list.tasks){
					// attach task:
					var task = list.tasks[taskId];
					task.size = taskSizeMatric(task);
					attachNodeTo(graph,task,list);
					for (memberId in task.members){
						// attach member:
						var member = task.members[memberId];
						attachNodeTo(graph,member,task);
					}
				}
			}
			
			publishGraphData(graph);
		});
				
		function onDoneCollectingServicesData() {
			loadFromRhizi();
		}
		
		function loadFromRhizi(){
			window.load();
		}
		
		function buildSubGroup(graph,nodeToExpand,subGroupName) {
			var subGroup = nodeToExpand[subGroupName];
			for (memberId in subGroup){
				// attach sub item:
				var item = subGroup[memberId];
				attachNodeTo(graph,item,nodeToExpand);
			}
		}
		
		function resourceTypeToRelationship(nodeAType,nodeBType){
			return 'link';
		}
		
		function attachNodeTo(graph,nodeA,nodeB){
			
			var edge = {	srcNode:nodeA,
							relationship: resourceTypeToRelationship() ,
							trgNode: nodeB,
							 id:(''+(nodeA.id)+'__'+nodeB.id)
						}
	
			graph.edges.push(edge);
			graph.nodes.push(nodeA);
			return graph;
			
		};
		
		function addNode(graph,node){
			
			graph.nodes.push(node);
		};


		function publishGraphData(graphData) {
			console.log('GraphBuilder: publishGraphData : completed cycle - graphData:');
			console.dir(graphData);
			
			// TBD: fill in Feedback on all nodes ?
			//getNodesFeedback(boardsGraphData);
			
			var payload = Formatter.format(graphData);
			console.dir(payload);
			
			
			window.push(payload);
		};

		// TBD: move dictSize to utils:
		function dictSize(obj) {
		    var size = 0, key;
		    for (key in obj) {
		        if (obj.hasOwnProperty(key)) size++;
		    }
		    return size;
		};
		
		function channelSizeMatric(channel){
			return (parseInt((dictSize(channel.members)/2),10)+Const.DEFAULT_NODE_SIZE) 	;	
		}
		
		function taskSizeMatric(task){
			return (parseInt((dictSize(task.members)/2),10)+Const.DEFAULT_NODE_SIZE) 	;	
		}

		function listSizeMatric(list){
			return (parseInt((list.tasksCount/2),10)+Const.DEFAULT_NODE_SIZE) ;		
		}
		
		function boardSizeMatric(board){
			return (parseInt((board.tasksCount/2),10)+Const.DEFAULT_NODE_SIZE) ;
		}
		
		function orgSizeMatric(org){
			return (parseInt((org.tasksCount/2),10)+Const.DEFAULT_NODE_SIZE) ;
		}		
				
		function collectData(){
			Tasks.collectData();
			Channels.collectData();
		}

		 return {
			collectData:collectData
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
				orgs[org.id].tasksCount = orgs[org.id].tasksCount + 1;
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
					
					//$rootScope.$broadcast("AggBoardsReady", orgToSend);
			
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
					//$rootScope.$broadcast("AggListsReady", {boardId:currentBoard});
			
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
					var board = data.board;
					orgs[org.id].boards[data.board.id] = board;
					//$rootScope.$broadcast("AggTasksReady",{boardId:orgs[org.id].boards[data.board.id]} );
					$rootScope.$broadcast("BoardLoadingDone",{orgs:orgs,boardDoneLoading: board});
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