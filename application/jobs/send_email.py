import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from jinja2 import Template
from weasyprint import HTML
from flask import current_app as app  #for logging


import os
current_dir = os.path.abspath(os.path.dirname(__file__))


#Make this read from config
SMTP_SERVER_HOST = "localhost"
SMTP_SERVER_PORT = 1025
SENDER_ADDRESS = "21f1006584@student.onlinedegree.iitm.ac.in"
SENDE_PASSWORD = ""

def sent_email(to_address, subject, message, content="text", attachment_file=None):
    msg = MIMEMultipart()
    msg["From"] = SENDER_ADDRESS
    msg["To"] = to_address
    msg["Subject"] = subject

    if content == "html":
        msg.attach(MIMEText(message, "html"))
    else:
        msg.attach(MIMEText(message, "plain"))

    if attachment_file:
        with open(attachment_file, "rb") as a_file:
            basename = os.path.basename(attachment_file)
            part = MIMEApplication(a_file.read(), Name=basename)
        part['Content-Disposition'] = 'attachment; filename="%s"' % basename
        msg.attach(part)


    s = smtplib.SMTP(host=SMTP_SERVER_HOST, port=SMTP_SERVER_PORT)
    s.login(SENDER_ADDRESS, SENDE_PASSWORD)
    s.send_message(msg)
    s.quit()
    return True  #Do a try catch

def format_message(template_file, data={}):
    with open(template_file) as file_:
        template = Template(file_.read())
        return template.render(data=data)

def create_pdf_report(data):
    i=data
    EMAIL_TEMPLATE_DIR = os.path.join(current_dir, "../../templates/reportpdf.html")
    message =format_message(EMAIL_TEMPLATE_DIR, data=i)
    html = HTML(string=message)
    file_name = str(i["email"])+".pdf"
    print(file_name)
    pdf = html.write_pdf()
    dirname = os.path.join(current_dir, "../../PdfFiles")
    if os.path.exists(dirname):
        f = open(os.path.join(dirname, file_name), 'wb')
        f.write(pdf)
        
def reminderemail(list):
    list = list
    for l in list:
        EMAIL_TEMPLATE_DIR = os.path.join(current_dir, "../../templates/remainderemail.html")
        message =format_message(EMAIL_TEMPLATE_DIR, data=l)
        subject = "Pending task Remainder"
        email = l['email']
        sent_email(to_address=email, subject=subject, message=message, content="html", attachment_file=None)
        app.logger.debug("Remainder mail attribute {}".format(l)) #For testing

def reportemail(list):
    list = list
    for l in list:
        EMAIL_TEMPLATE_DIR = os.path.join(current_dir, "../../templates/reportemail.html")
        message =format_message(EMAIL_TEMPLATE_DIR, data=l)
        create_pdf = create_pdf_report(data=l)
        file_name = str(l["email"])+".pdf"
        pdf_file = os.path.join(current_dir, "../../PdfFiles/", file_name)
        subject = "Monthly report"
        email = l['email']
        sent_email(to_address=email, subject=subject, message=message, content="html", attachment_file=pdf_file)
        app.logger.debug("Report mail attribute {}".format(l)) #For testing
        os.remove(pdf_file) #Pdf file is deleted after sending mail


def csvemail(email, uname):
    email = email
    uname = uname
    l = {"uname":uname, "email":email}
    EMAIL_TEMPLATE_DIR = os.path.join(current_dir, "../../templates/csvemail.html")
    message =format_message(EMAIL_TEMPLATE_DIR, data=l)
    file_name = email+".csv"
    csv_file = os.path.join(current_dir, "../../CSVFiles/", file_name)
    subject = "Export as CSV file"
    sent_email(to_address=email, subject=subject, message=message, content="html", attachment_file=csv_file)
    app.logger.debug("Report mail attribute {}".format(l)) #For testing
    os.remove(csv_file) #Pdf file is deleted after sending mail