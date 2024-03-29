"use strict"

/**
 * Manage backend websocket connection
 */
define([ 'util', 'model/diff', 'model/util', 'socketio'], function(util, model_diff, model_util, io) {

    var ws_server_url = 'http://%h:%p/graph'; // socketio namespace
    ws_server_url = ws_server_url.replace('%h',  rz_config.rz_server_host);
    ws_server_url = ws_server_url.replace('%p',  rz_config.rz_server_port);

    var socket;
    var rz_mesh_graph_ref;

    /**
     * @param init_spec: expected to contain a graph:graph mapping
     */
    function init(init_spec) {

        socket = io.connect(ws_server_url, {
            'reconnectionDelay': 3000,
        });

        util.assert(undefined != init_spec.graph, 'unable to init ws connection, graph undefined');
        rz_mesh_graph_ref = init_spec.graph;

        // wire up event handlers
        socket.on('connect', on_connect);
        socket.on('disconnect', on_disconnect);
        socket.on('error', on_error);
        socket.on('diff_commit__topo', ws_diff_merge__topo);
        socket.on('diff_commit__attr', ws_diff_merge__attr);

        // attempt to actively disconnect on tab/window close
        // ref: https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers.onbeforeunload
        window.addEventListener("beforeunload", function(e){
            socket.disconnect();
            console.log('ws: connection closed on \'beforeunload\' event'); // no one will ever see this but still
        });
    }

    function on_connect() {
        console.log('ws: connection established: endpoint: ' + ws_server_url);
    }

    function on_disconnect() {
        console.log('ws: connection closed on peer disconnect, endpoint: ' + ws_server_url);
    }

    function on_error(err) {
        console.log('ws: error: ' + err);
    }

    /**
     * Handle websocket incoming Topo_Diffs
     *
     * @param topo_diff_cr: Topo_Diff commit result object
     */
    function ws_diff_merge__topo(topo_diff_spec_raw, topo_diff_cr) {

        // adapt from wire format, no need to do the same for id_sets
        var node_set_add = topo_diff_spec_raw.node_set_add.map(model_util.adapt_format_read_node)
        var link_ptr_set = topo_diff_spec_raw.link_set_add.map(model_util.adapt_format_read_link_ptr)

        var topo_diff_spec = { node_set_add: node_set_add,
                               link_set_add: link_ptr_set,
                               node_id_set_rm: topo_diff_spec_raw.node_id_set_rm,
                               link_id_set_rm: topo_diff_spec_raw.link_id_set_rm };

        // [!] note: this is not a pure Topo_Diff object in the sense it contain a link_ptr_set,
        // not a resolved link object set
        var topo_diff = model_diff.new_topo_diff(topo_diff_spec); // run through validation

        console.log('ws: rx: ws_diff_merge__topo, committing wire-adapted topo_diff:', topo_diff);

        rz_mesh_graph_ref.commit_diff__topo(model_diff.new_topo_diff(topo_diff_spec));
    }

    /**
     * Handle websocket incoming Attr_Diffs
     *
     * @param attr_diff_cr: Attr_Diff commit result object
     */
    function ws_diff_merge__attr(attr_diff_spec, attr_diff_cr) {
        var attr_diff = model_diff.new_attr_diff_from_spec(attr_diff_spec); // run through validation
        console.log('ws: rx: ws_diff_merge__attr, committing wire-adapted topo_diff:', attr_diff);
        rz_mesh_graph_ref.commit_diff__attr(attr_diff);
    }

    return {
        init : init
    };

});
