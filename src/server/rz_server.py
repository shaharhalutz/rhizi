#!/usr/bin/python

# TBD: Shahar add deap user authentication API to backend
from datetime import datetime, timedelta
import jwt
import json
import requests
from urlparse import parse_qs, parse_qsl
from urllib import urlencode
from flask import g,  url_for
from werkzeug.security import generate_password_hash, check_password_hash
from requests_oauthlib import OAuth1
from jwt import DecodeError, ExpiredSignature
import urllib2


import argparse
from flask import Flask
from flask import Response
from flask import redirect
from flask import request
from flask import send_from_directory
from flask import session
from flask import  jsonify
import flask
from functools import wraps
import logging
import os
import re
import signal

import db_controller as dbc
import rz_api
import rz_api_rest
import rz_feedback
from rz_kernel import RZ_Kernel
from rz_mesh import init_ws_interface
from rz_req_handling import make_response__http__empty
import rz_server_ctrl
import rz_user
from rz_user_db import User_DB

# deap import:
from deap_user_db import deap_db
import deap_user_auth 
import deap_user_api

class Config(object):
    """
    rhizi-server configuration

    TODO: config option documentation
    
        listen_address
        listen_port
        log_level: upper/lower case log level as specified by the logging module
        neo4j_url
        root_path
    """

    @staticmethod
    def init_from_file(file_path):

        if False == os.path.exists(file_path):
            raise Exception('config file not found: ' + file_path)

        # apply defaults
        cfg = {}
        cfg['access_control'] = True
        cfg['config_dir'] = os.path.abspath(os.path.dirname(file_path))  # bypass prop restriction
        cfg['development_mode'] = False
        cfg['listen_address'] = '127.0.0.1'
        cfg['listen_port'] = 8080
        cfg['log_level'] = 'INFO'
        cfg['root_path'] = os.getcwd()
        cfg['static_url_path'] = '/static'
        cfg['user_db_path'] = os.path.join(cfg['config_dir'], 'user_db.db')

        # client configuration
        cfg['optimized_main'] = False

        # Mail settings
        cfg['mail_hostname'] = 'localhost'
        cfg['mail_port'] = 25

        # User feedback settings
        cfg['feedback_recipient'] = 'feedback@localhost'

        # Flask keys
        cfg['SECRET_KEY'] = ''

        with open(file_path, 'r') as f:
            for line in f:
                if re.match('(^#)|(\s+$)', line):
                    continue

                kv_arr = line.split('=')
                if 2 != len(kv_arr):
                    raise Exception('failed to parse config line: ' + line)

                k, v = map(str.strip, kv_arr)

                if None != cfg.get(k):
                    # apply type conversion based on default value type
                    type_f = type(cfg[k])
                    if bool == type_f:
                        v = v in ("True", "true")  # workaround bool('false') = True
                    else:
                        v = type_f(v)

                # [!] we can't use k.lower() as we are loading Flask configuration
                # keys which are expected to be capitalized
                cfg[k] = v

        ret = Config()
        ret.__dict__ = cfg  # allows setting of @property attributes

        # validate config
        if False == os.path.isabs(ret.root_path):
            ret.root_path = os.path.abspath(ret.root_path)

        return ret

    def __str__(self):
        kv_item_set = []
        for k, v in self.__dict__.items():
            if k == 'SECRET_KEY':  # exclude key from logs
                v = v[:3] + '...'
            kv_item_set.append('%s: %s' % (k, v))

        kv_item_set.sort()
        return '\n'.join(kv_item_set)

    @property
    def db_base_url(self):
        return self.neo4j_url

    @property
    def tx_api_path(self):
        return '/db/data/transaction'

    @property
    def config_dir_path(self):
        return self.config_dir

    @property
    def secret_key(self):
        return self.SECRET_KEY

class FlaskExt(Flask):
    """
    Flask server customization
    """

    def __init__(self, import_name, *args, **kwargs):
        """
        reserved for future use
        """
        super(FlaskExt, self).__init__(import_name, *args, **kwargs)

    def before_request(self, *args, **kwargs):
        # TODO impl
        pass

    def make_default_options_response(self):
        ret = Flask.make_default_options_response(self)

        ret.headers['Access-Control-Allow-Origin'] = 'http://rhizi.net'
        ret.headers['Access-Control-Allow-Headers'] = "Accept, Authorization, Content-Type, Origin"
        ret.headers['Access-Control-Allow-Credentials'] = 'true'

        # ret.headers['Access-Control-Allow-Methods'] = ', '.join(m_list)
        return ret

def init_log(cfg):
    """
    init log file, location derived from configuration
    """
    log = logging.getLogger('rhizi')

    log_level = logging._levelNames.get(cfg.log_level.upper())
    assert None != log_level, 'failed to determine log level'

    log.setLevel(log_level)
    log_handler_c = logging.StreamHandler()
    log_handler_f = logging.FileHandler(cfg.log_path)

    log.addHandler(log_handler_c)
    log.addHandler(log_handler_f)
    return log

def init_rest_interface(cfg, flask_webapp):
    """
    Initialize REST interface
    """

    def rest_entry(path, f, flask_args={'methods': ['POST']}):
        return (path, f, flask_args)

    # deap login decorator:
    def parse_token(req):
        authHeader = req.headers.get('x-access-token')
        print 'parse_token: authHeader:'+str(authHeader)
        token = authHeader.split()[1]
        TOKEN_SECRET = 'JWT Token Secret String' # TBD: solve TOKEN_SECRET get from config of app
        return jwt.decode(token, TOKEN_SECRET)


    def deap_login_required_decorator(f): 
        @wraps(f)
        def decorated_function(*args, **kwargs):
            authHeader = request.headers.get('x-access-token')
            if not authHeader:
                response = jsonify(message='Missing authorization header:'+str(authHeader))
                response.status_code = 401
                return response

            try:
                payload = parse_token(request)
            except DecodeError:
                response = jsonify(message='Token is invalid')
                response.status_code = 401
                return response
            except ExpiredSignature:
                response = jsonify(message='Token has expired')
                response.status_code = 401
                return response

            g.user_id = payload['sub']

            return f(*args, **kwargs)

        return decorated_function


    def login_decorator(f):
        """
        security boundary: assert logged-in user before executing REST api call
        """
        @wraps(f)
        def wrapped_function(*args, **kw):
            if not 'username' in session:
                return redirect('/login')
            return f(*args, **kw)

        return wrapped_function


    def localhost_access_decorator__ipv4(f):
        """
        security boundary: assert request originated from localhost 
        """

        @wraps(f)
        def wrapped_function(*args, **kw):

            if '127.0.0.1' != request.remote_addr:
                log.warning('unauthorized attempt to access localhost restricted path: %s' % (request.path))
                return make_response__http__empty(stauts=403)

            return f(*args, **kw)

        return wrapped_function

    rest_entry_set = [
                      # REST endpoints
                      rest_entry('/feedback', rz_feedback.rest__send_user_feedback__email),
                      rest_entry('/graph/clone', rz_api.rz_clone),
                      rest_entry('/graph/diff-commit-set', rz_api.diff_commit__set),
                      rest_entry('/graph/diff-commit-topo', rz_api_rest.diff_commit__topo),
                      rest_entry('/graph/diff-commit-attr', rz_api_rest.diff_commit__attr),
                      rest_entry('/graph/diff-commit-vis', rz_api_rest.diff_commit__vis),
                      # TBD: rest_entry('/index', rz_api.index, {'methods': ['GET']}),
                      rest_entry('/', rz_api.deap_index, {'methods': ['GET']}),
                      rest_entry('/load/node-set-by-id', rz_api.load_node_set_by_id_attr),
                      rest_entry('/load/link-set/by_link_ptr_set', rz_api.load_link_set_by_link_ptr_set),
                      rest_entry('/login', rz_user.rest__login, {'methods': ['GET', 'POST']}),
                      rest_entry('/logout', rz_user.rest__logout, {'methods': ['GET', 'POST']}),
                      rest_entry('/match/node-set', rz_api.match_node_set_by_attr_filter_map),
                      rest_entry('/signup', rz_user.rest__user_signup, {'methods': ['GET', 'POST']}),

                      # server administration: access restricted to localhost
                      rest_entry('/monitor/server-info', rz_server_ctrl.monitor__server_info, {'methods': ['GET']}),
                      rest_entry('/monitor/user/list', rz_server_ctrl.rest__list_users, {'methods': ['GET']}),
                      
                      # deap auth:                   
                      rest_entry('/auth/login', deap_user_auth.deap_login, {'methods': ['POST']}),
                      rest_entry('/auth/signup',deap_user_auth.signup, {'methods': ['POST']}),
                      rest_entry('/auth/slack',deap_user_auth.slack, {'methods': ['POST']}),
                      rest_entry('/auth/trello',deap_user_auth.trello, {'methods': ['POST']}),

                      # deap users api:
                      rest_entry('/api/me', deap_user_api.me, {'methods': ['GET']}),
                      rest_entry('/api/updateMe',deap_user_api.update_me, {'methods': ['POST']}),
                      rest_entry('/api/deapusers',deap_user_api.deapUsers, {'methods': ['GET']}),

                      # redirects - currently handled by reverse proxy
                  ]

    # FIXME: but should be rate limited (everything should be, regardless of login)
    no_login_paths = ['/login', '/feedback', '/signup']
    
    # TBD: remove rhizi login?
    deap_login_paths = ['/api/me', '/api/updateMe', '/api/deapusers']


    for re_entry in rest_entry_set:
        rest_path, f, flask_args = re_entry

        if rest_path in deap_login_paths:
            # currently require login on all but /login paths
            f = deap_login_required_decorator(f)

        if cfg.access_control and rest_path not in no_login_paths:
            # currently require login on all but /login paths
            f = login_decorator(f)

        # apply local host access restriction
        if rest_path.startswith('/monitor'):
            f = localhost_access_decorator__ipv4(f)

        # [!] order seems important - apply route decorator last
        route_dec = flask_webapp.route(rest_path, **flask_args)
        f = route_dec(f)

        flask_webapp.f = f  # assign decorated function

def init_webapp(cfg, kernel, db_ctl=None):
    """
    Initialize webapp:
       - call init_rest_interface()
    """
    root_path = cfg.root_path
    assert os.path.exists(root_path), "root path doesn't exist: %s" % root_path
 
    webapp = FlaskExt(__name__,
                      static_folder='static',
                      static_url_path=cfg.static_url_path)

    webapp.config.from_object(cfg)
    webapp.root_path = root_path  # for some reason calling config.from_xxx() does not have effect

    if None == db_ctl:
        db_ctl = dbc.DB_Controller(cfg)
    rz_api.db_ctl = db_ctl
    rz_api_rest.db_ctl = db_ctl
    kernel.db_ctl = db_ctl

    webapp.rz_config = cfg
    webapp.kernel = kernel

    # init deap DB:
    deap_db.app = webapp
    deap_db.init_app(webapp)
    deap_db.create_all()

    init_rest_interface(cfg, webapp)
    return webapp

def init_config(cfg_dir):
    cfg_path = os.path.join(cfg_dir, 'rhizi-server.conf')
    cfg = Config.init_from_file(cfg_path)
    return cfg

def init_user_db():
    global user_db

    try:
        user_db = User_DB(db_path=cfg.user_db_path)
        user_db.init(mode='c')  # dev default: create DB
    except Exception as e:
        log.exception('failed to init user_db, configured user_db path: %s' % (cfg.user_db_path))
        raise e

    log.info('user DB initialized: path: %s' % (cfg.user_db_path))
    return user_db

def init_signal_handlers():

    def signal_handler__exit(signum, frame):
        log.info('received exit signal: SIGINT/SIGTERM')
        shutdown()
        exit(0)

    signal.signal(signal.SIGINT, signal_handler__exit)
    signal.signal(signal.SIGTERM, signal_handler__exit)

def shutdown():
    user_db.shutdown()
    log.info('rz_server: shutting down')

class MinimalLog(object):
    """
    Minimal logger implementation to serve until init_log completes, which
    means init_config succeeded as well.
    """
    def exception(self, e):
        print(e)
    def info(self, msg):
        print(msg)

log = MinimalLog()

if __name__ == "__main__":

    p = argparse.ArgumentParser(description='rhizi-server')
    p.add_argument('--config-dir', help='path to Rhizi config dir', default='res/etc')
    args = p.parse_args()

    try:
        cfg = init_config(args.config_dir)
        log = init_log(cfg)
        cfg_indent_str = '   ' + str(cfg).replace('\n', '\n   ')
        log.info('loaded configuration:\n%s' % cfg_indent_str)  # print indented
        if False == cfg.access_control:
            log.warn('[!] access control disabled, all-granted access set on all URLs')

        init_signal_handlers()
        init_user_db()
    except Exception as e:
        log.exception('failed to initialize server')
        log.info('failed initialization, aborting')
        exit(-1)

    kernel = RZ_Kernel()
    webapp = init_webapp(cfg, kernel)
    ws_srv = init_ws_interface(cfg, kernel, webapp)

    webapp.user_db = user_db

    try:
        ws_srv.serve_forever()
    except Exception as e:
        log.exception(e)

    shutdown()
