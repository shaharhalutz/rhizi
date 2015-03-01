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
	                trello=self.trello,trelloId=self.trelloId,slack=self.slack,facebook=self.facebook, google=self.google,
	                linkedin=self.linkedin, twitter=self.twitter, reputation=self.reputation)

