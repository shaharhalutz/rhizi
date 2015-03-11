from flask.ext.sqlalchemy import SQLAlchemy
from flask import current_app
deap_db = SQLAlchemy()
db = deap_db


class User(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	email = db.Column(db.String(120), unique=True)
	password = db.Column(db.String(120))
	display_name = db.Column(db.String(120))
	trello = db.Column(db.String(120))
	trelloId = db.Column(db.String(120))
	
	slack = db.Column(db.String(120))
	slack_token = db.Column(db.String(120))
	facebook = db.Column(db.String(120))
	github = db.Column(db.String(120))
	google = db.Column(db.String(120))
	linkedin = db.Column(db.String(120))
	twitter = db.Column(db.String(120))
	
	reputation = db.Column(db.Integer)

	def __init__(self, email=None, password=None, display_name=None,slack=None,slack_token=None,trello=None,trelloId=None,facebook=None, github=None, google=None, linkedin=None,twitter=None,reputation=None):
		if email:
			self.email = email.lower()
		if password:
			self.set_password(password)
		if display_name:
			self.display_name = display_name
		if slack:
			self.slack = slack
		if slack_token:
			self.slack_token = slack_token
		if trello:
			self.trello = trello
		if trelloId:
			self.trelloId = trelloId
		if facebook:
			self.facebook = facebook
		if google:
			self.google = google
		if linkedin:
			self.linkedin = linkedin
		if twitter:
			self.twitter = twitter
		if reputation:
			self.reputation = reputation

	def set_password(self, password):
	    self.password = generate_password_hash(password)

	def check_password(self, password):
	    return check_password_hash(self.password, password)

	def to_json(self):
	    return dict(id=self.id, email=self.email, displayName=self.display_name,
	                trello=self.trello,trelloId=self.trelloId,slack=self.slack,slackToken=self.slack_token,facebook=self.facebook, google=self.google,
	                linkedin=self.linkedin, twitter=self.twitter, reputation=self.reputation)

class Feedback(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	sourceId = db.Column(db.String(120))
	sourceName = db.Column(db.String(120))
	targetId = db.Column(db.String(120))
	targetName = db.Column(db.String(120))
	description = db.Column(db.String(120))
	feedback = db.Column(db.Integer())
	avgFeedback = db.Column(db.Integer())
	targetType = db.Column(db.String(120))

	def set_password(self, password):
	    self.password = generate_password_hash(password)

	def __init__(self, sourceId=None,sourceName=None, targetId=None,targetName=None, description=None,feedback=None,avgFeedback=None,targetType = None):
		if sourceId:
			self.sourceId = sourceId
		if targetId:
			self.targetId = targetId
		if description:
			self.description = description
		if feedback:
			self.feedback = feedback
		if sourceName:
			self.sourceName = sourceName
		if targetName:
			self.targetName = targetName
		if targetType:
			self.targetType = targetType
		if avgFeedback:
			self.avgFeedback = avgFeedback	

	def to_json(self):
		return dict(id=self.id, sourceId=self.sourceId, targetId=self.targetId, description=self.description, feedback=self.feedback, sourceName=self.sourceName
					, targetName=self.targetName, targetType=self.targetType, avgFeedback=self.avgFeedback)
