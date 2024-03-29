import base64
from flask import current_app
from flask import json
from flask import request
from flask import session
import logging

from rz_mail import send_email_message
from rz_req_handling import make_response__json


log = logging.getLogger('rhizi')

class RZ_User_Feedback(object):
    def __init__(self, url=None,
                       note=None,
                       img=None,
                       html=None,
                       user_agent=None):

        self.url = url,
        self.note = note
        self.img = img
        self.html = html
        self.user_agent = user_agent

def decode_base64_uri(base64_encoded_data_uri):
    start = base64_encoded_data_uri.find(',') + 1
    encoded = base64_encoded_data_uri[start:]
    return base64.decodestring(encoded)

def rest__send_user_feedback__email():
    """
    REST API endpoint: send user feedback by email along with screen capture attachments
    """

    def sanitize_input(req):
        req_dict = req.get_json()
        url = req_dict['url']
        note = req_dict['note']
        img = decode_base64_uri(req_dict['img'])
        html = req_dict['html']
        user_agent = req_dict['browser']['userAgent']
        return RZ_User_Feedback(url=url,
                                note=note,
                                img=img,
                                html=html,
                                user_agent=user_agent)

    try:
        u_feedback = sanitize_input(request)
    except:
        log.warn('failed to sanitize inputs. request: %s' % request)
        return make_response__json(status=400)  # bad Request

    # FIXME: should be async via celery (or another method)
    session_user = session.get('username')

    msg_body = ['Feedback from user:',
                     '',
                     'user: %s' % (session_user if session_user else "<not-logged-in>"),
                     'user-agent: %s' % (u_feedback.user_agent),
                     'watching URL: %s' % (u_feedback.url),
                     'user-note: %s' % (u_feedback.note),
                     ''
                     ]
    msg_body = '\n'.join(msg_body)

    try:
        send_email_message(recipients=[current_app.rz_config.feedback_recipient],
                           subject="User Feedback",
                           body=msg_body,
                           attachments=[('feedback_screenshot.png', 'image/png', u_feedback.img),
                                        ('feedback_page.html', 'text/html', u_feedback.html),
                                        ])
        return make_response__json()  # return empty json response

    except Exception:
        log.exception('send_user_feedback__email: exception while sending email')  # exception derived from stack
        return make_response__json(status=500)
