from datetime import datetime, timedelta
import os
import jwt
import json
import requests
from functools import wraps
from urlparse import parse_qs, parse_qsl
from urllib import urlencode
from flask import Flask, g, send_file, request, redirect, url_for, jsonify
from flask.ext.sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from requests_oauthlib import OAuth1
from jwt import DecodeError, ExpiredSignature
from trello import TrelloApi
import urllib2
import math

from  deap_user_db import User
from  deap_user_db import deap_db as db



def create_token(user):
    payload = {
        'sub': user.id,
        'iat': datetime.now(),
        'exp': datetime.now() + timedelta(days=14)
    }
    TOKEN_SECRET = 'JWT Token Secret String'
    token = jwt.encode(payload, TOKEN_SECRET)
    return token.decode('unicode_escape')

# deap login decorator:
def parse_token(req):
    authHeader = req.headers.get('x-access-token')
    print 'parse_token: authHeader:'+str(authHeader)
    token = authHeader.split()[1]
    TOKEN_SECRET = 'JWT Token Secret String' # TBD: solve TOKEN_SECRET get from config of app
    return jwt.decode(token, TOKEN_SECRET)

# Auth Routes:
def deap_login():
    user = User.query.filter_by(email=request.json['email']).first()
    if not user or not user.check_password(request.json['password']):
        response = jsonify(message='Wrong Email or Password')
        response.status_code = 401
        return response
    token = create_token(user)
    return jsonify(token=token)


def signup():
    user = User(email=request.json['email'], password=request.json['password'])
    db.session.add(user)
    db.session.commit()
    token = create_token(user)
    return jsonify(token=token)


# Services Auth Routes:
def slack():
    SLACK_SECRET = os.environ.get('SLACK_SECRET') or 'e7efc9a81d4043defb7b7e27816ae27e'
    access_token_url = 'https://slack.com/api/oauth.access'
    users_api_url = 'https://slack.com/api/auth.test'

    params = {
        'client_id': request.json['clientId'],
        'redirect_uri': request.json['redirectUri'],
        'client_secret': SLACK_SECRET,
        'code': request.json['code']
    }

    # Step 1. Exchange authorization code for access token.
    r = requests.get(access_token_url, params=params)
    print 'r.text:'+str(r.text)

    response = json.loads(r.text)
    print str(response)
    access_token = response["access_token"]
    
    headers = {'User-Agent': 'DEAP'}
    print 'access_token:'+str(access_token)

    # Step 2. Retrieve information about the current user.
    r = requests.get(users_api_url, params={'token':access_token}, headers=headers)
    profile = json.loads(r.text)
    print 'slack profile:'+str(profile)
    	   
    # Step 3. (optional) Link accounts.
    if request.headers.get('x-access-token'):
        user = User.query.filter_by(slack=profile['user_id']).first()
        if user:
            response = jsonify(message='There is already a Slack account that belongs to you')
            response.status_code = 409
            return response

        payload = parse_token(request)

        user = User.query.filter_by(id=payload['sub']).first()
        if not user:
            response = jsonify(message='User not found')
            response.status_code = 400
            return response

        u = User(slack=profile['user_id'], display_name=profile['user'])
        db.session.add(u)
        db.session.commit()
        token = create_token(u)
        return jsonify(token=token)

    # Step 4. Create a new account or return an existing one.
    user = User.query.filter_by(slack=profile['user_id']).first()
    if user:
        token = create_token(user)
        return jsonify(token=token)

    print 'slack profile:'+str(profile)
    u = User(slack=profile['user_id'],slack_token =access_token, display_name=profile['user'])
    db.session.add(u)
    db.session.commit()
    token = create_token(u)
    return jsonify(token=token)



def trello():
    print 'request'+str(request)
    print dir(request.form)
    # recieved params:
    params = dict(token=request.form['token'],
                  service=request.form['service'],
                  serviceMemberId=request.form['serviceMemberId'],
                  display_name=request.form['display_name'],
                  id=request.form['id'],
                  email=request.form['email'])

    print 'token:'+str(params['token'])
    print 'service:'+str(params['service'])
    print 'display_name:'+str(params['display_name'])

    # check if user exists already (if not create):
    user = db.session.query(User).filter(User.id == params['id']).first()
    print 'user:'+str(user)
    if (not user):
        return 'user does not exist', 404

    user.trello = request.form['token']
    user.trelloId = request.form['serviceMemberId']
    #db.session.add(u)
    db.session.commit()	

    return 'token recieved and saved on user:'+str(user.display_name), 201






