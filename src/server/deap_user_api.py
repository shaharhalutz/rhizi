
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

from  deap_user_db import User,Feedback
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


# Feedback:
def update_feedback():
	
	# get source - User which is logged in :
	if(not g.user_id):
		print 'User Not Logged In.',404
		return 'User Not Logged In.',404

	user = User.query.filter_by(id=g.user_id).first()
	if (not user):
		print 'you have not yet activated the slack service. to activate, please login to :'+DEAP_SERVICE_ACTIVATION_URL, 201
		return 'you have not yet activated the slack service. to activate, please login to :'+DEAP_SERVICE_ACTIVATION_URL, 201
	
	sourceId = user.id
	sourceName = user.display_name
	
	# get feedback:
	feedback = Feedback.query.filter_by(sourceId=g.user_id,targetId=request.json['targetId']).first()
	
	if(request.json['delete']):
		# delete:
		if(not feedback):
			# no feedback exists so nothing to delete:
			res= {'data':request.json}
			print 'no feedback exists so nothing to delete:'
			return jsonify(res)
		else:
			# remove feedback 
			db.session.delete(feedback)
			db.session.commit()
	else:
		if(feedback):
			# override  my feedback 
			feedback.feedback = request.json['feedback']
			feedback.description = request.json['description']
			
		else:
			# if does not exist create new feedback:
			feedback = Feedback(sourceId=sourceId, sourceName=sourceName,targetId=request.json['targetId'],targetName=request.json['targetName'],description=request.json['description'],feedback=request.json['feedback'],targetType=request.json['targetType'])
		
		# recalculate and update avgFeedback for target:
		newAvgFeedback = calculate_and_update_avg_feedback(feedback)
		
		# save current feedback
		feedback.avgFeedback = 	newAvgFeedback
		db.session.add(feedback)
		
		db.session.commit()
		
	data = request.json
	data['avgFeedback'] = feedback.avgFeedback
	res= {'data':data}
	print 'save_feedback:'+str(res)
	return jsonify(res)



def get_feedback():

	# get source - User which is logged in :
	if(not g.user_id):
		print 'User Not Logged In.',404
		return 'User Not Logged In.',404

	user = User.query.filter_by(id=g.user_id).first()
	if (not user):
		print 'you have not yet activated the slack service. to activate, please login to :'+DEAP_SERVICE_ACTIVATION_URL, 201
		return 'you have not yet activated the slack service. to activate, please login to :'+DEAP_SERVICE_ACTIVATION_URL, 201

	sourceId = user.id
	sourceName = user.display_name

	# get feedback:
	data = {}
	feedback = Feedback.query.filter_by(sourceId=g.user_id,targetId=request.json['targetId']).first()
	if(feedback):
		data = feedback.to_json()
		print 'get_feedback response:'+str(data)
		return jsonify(data)
	return jsonify(request.json)


# resaves all feedbacks except for current one:
def calculate_and_update_avg_feedback(feedback):
	
	print 'calculateAvgFeedback , feedback.id:'+str(feedback.id)
	
	targetfFeedbacks = Feedback.query.filter_by(targetId=feedback.targetId).all()
	total = int(feedback.feedback)
	count = 1
	for tFeedback in targetfFeedbacks:
		if(not tFeedback.id == feedback.id):
			count = count+1
			total = total + int(tFeedback.feedback)

	newAvg = math.ceil(total/count)	
	
	# update  new Avg:
	for tFeedback in targetfFeedbacks:
		# save feedback
		if(not tFeedback.id  == feedback.id):
			tFeedback.avgFeedback = newAvg
			db.session.add(tFeedback)

	return  newAvg

def feedback_get_all():
	feedbacks = Feedback.query.all()
	return jsonify(json_list=[fb.to_json() for fb in feedbacks])
	

