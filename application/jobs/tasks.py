from application.jobs.workers import celery
from datetime import datetime
from celery.schedules import crontab #This is for scheduling a task
from flask import current_app as app  #for logging

import csv
import os
current_dir = os.path.abspath(os.path.dirname(__file__))



from application.data.database import db
from application.data.models import User, List, Card
from application.jobs import send_email


@celery.on_after_configure.connect
def setup_periodic_task(sender, **kwargs):
    # celery crontab uses UTC (IST = UTC+5.30)
    # config changes like (CELERY_TIMEZONE = "Asia/Calcutta") & (CELERY_ENABLE_UTC = False) didn't work
    # so put IST-5.30 in crontab
    sender.add_periodic_task(crontab(hour=11, minute=30), email_reminnder.s(), name='Daily remainder')
    sender.add_periodic_task(crontab(day_of_month=1, hour=11, minute=30), email_report.s(), name='Monthly report')
    # sender.add_periodic_task(150, email_reminnder.s(), name='Daily remainder') #For testing
    # sender.add_periodic_task(60, email_report.s(), name='Monthly report') #For testing
    



@celery.task()
def email_reminnder():
    pendings = db.session.query(Card).filter(Card.status == False).all()
    maillist = []
    for pending in pendings:
        task = pending.task
        lname = db.session.query(List.lname).filter(List.lid == pending.lid).first()
        uid = db.session.query(List.uid).filter(List.lid == pending.lid).first()
        email = db.session.query(User.email).filter(User.id == uid[0]).first()
        uname = db.session.query(User.uname).filter(User.id == uid[0]).first()
        maildetails = {"uname":uname[0], "email":email[0], "lname":lname[0], "task":task}
        maillist.append(maildetails)
    app.logger.debug("Daily remainder list {}".format(maillist)) #For testing
    send_email.reminderemail(list=maillist)

@celery.task()
def email_report():
    users = db.session.query(User).all()
    maillist = []
    now = datetime.now()
    today = str(now.year)+'-'+str(now.month)+'-'+str(now.day)
    date1 = datetime.strptime(today, "%Y-%m-%d")
    summary = []
    userlists = []
    pending_ok = 0
    pending_notok = 0
    done_ok = 0
    done_notok = 0
    for user in users:
        email = user.email
        uname = user.uname
        uid = user.id
        lists = db.session.query(List).filter(List.uid == uid).all()
        for list in lists:
            lid = list.lid
            cards = db.session.query(Card).filter(Card.lid == lid).all()
            for card in cards:
                if (card.status == False):
                    date2 = datetime.strptime(card.deadline, "%Y-%m-%d")
                    diffDays = (date1-date2).days
                    if (diffDays > 0):
                        pending_notok += 1
                    else:
                        pending_ok += 1
                else:
                    date2 = datetime.strptime(card.deadline, "%Y-%m-%d")
                    date3 = datetime.strptime(card.completion_time, "%Y-%m-%d")
                    diffDays = (date3-date2).days
                    if (diffDays > 0):
                        done_notok += 1
                    else:
                        done_ok += 1
            summary.append([list.lname, done_ok, done_notok, pending_ok, pending_notok])
            userlists.append(list.lname)
            pending_ok = 0
            pending_notok = 0
            done_ok = 0
            done_notok = 0
        maildetails = {"uname":uname, "email":email, "userlists":userlists, "summary":summary}
        userlists = []
        summary = []
        maillist.append(maildetails)
    app.logger.debug("Monthly report list {}".format(maillist)) #For testing
    send_email.reportemail(list=maillist)


@celery.task()
def export_csv(email):
    email = email
    header = ['List Name', 'Task Name', 'Task Details', 'Create Time', 'Deadline', 'Status', 'Completion Time']
    data = []
    user = db.session.query(User).filter(User.email == email).first() #First not nescessary as email constraint is unique
    uid = user.id
    uname = user.uname
    lists = db.session.query(List).filter(List.uid == uid).all()
    for list in lists:
        lid = list.lid
        lname = list.lname
        cards = db.session.query(Card).filter(Card.lid == lid).all()
        for card in cards:
            data.append([lname, card.task, card.details, card.create_time, card.deadline, card.status, card.completion_time])
    file_name = email+".csv"
    dirname = os.path.join(current_dir, "../../CSVFiles")
    if os.path.exists(dirname):
        with open(os.path.join(dirname, file_name), 'w', encoding='UTF8') as f:
            writer = csv.writer(f)
            writer.writerow(header)
            writer.writerows(data)
    send_email.csvemail(email=email, uname=uname)
    app.logger.debug("Export mail attribute {}".format(email)) #For testing



@celery.task()
def export_list_csv(email, lname):
    email = email
    lname = lname
    header = ['List Name', 'Task Name', 'Task Details', 'Create Time', 'Deadline', 'Status', 'Completion Time']
    data = []
    user = db.session.query(User).filter(User.email == email).first() #First not nescessary as email constraint is unique
    uid = user.id
    uname = user.uname
    lists = db.session.query(List).filter(List.uid == uid, List.lname == lname).all()
    for list in lists:
        lid = list.lid
        cards = db.session.query(Card).filter(Card.lid == lid).all()
        for card in cards:
            data.append([lname, card.task, card.details, card.create_time, card.deadline, card.status, card.completion_time])
    file_name = email+".csv"
    dirname = os.path.join(current_dir, "../../CSVFiles")
    if os.path.exists(dirname):
        with open(os.path.join(dirname, file_name), 'w', encoding='UTF8') as f:
            writer = csv.writer(f)
            writer.writerow(header)
            writer.writerows(data)
    send_email.csvemail(email=email, uname=uname)
    app.logger.debug("Export mail attribute {}".format(email)) #For testing