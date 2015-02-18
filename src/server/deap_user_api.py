
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


# API - ME :
def me():
    if(not g.user_id):
        print 'User Not Logged In.',404
        return 'User Not Logged In.',404
	
    user = User.query.filter_by(id=g.user_id).first()
    
    if(not user):
        print 'User Not Logged In.',404
        return 'User Not Logged In.',404	
    
    return jsonify(user.to_json())



def create_token(user):
    payload = {
        'sub': user.id,
        'iat': datetime.now(),
        'exp': datetime.now() + timedelta(days=14)
    }
    TOKEN_SECRET = 'JWT Token Secret String'
    token = jwt.encode(payload, TOKEN_SECRET)
    return token.decode('unicode_escape')

def update_me():
    user = User.query.filter_by(id=g.user_id).first()
    user.email =  request.json['email']
    user.display_name =  request.json['displayName']
    #user = User(email=request.json['email'], password=request.json['password'])
    #db.session.add(user)
    db.session.commit()
    token = create_token(user)
    return jsonify(token=token)
 
	
"""
   if not users :
       print 'coudnt find found users'
       response = jsonify(message='coudnt find found users')
       response.status_code = 401
       return response
"""
   

# API - USERS:
def deapUsers():
	users = User.query.all()	
	return jsonify(json_list=[user.to_json() for user in users])
	
