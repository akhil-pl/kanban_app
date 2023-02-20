from flask import request
from flask import render_template
from flask import current_app as app
from flask_security import login_required, current_user
from main import cache




@app.route("/", methods=["GET", "POST"])
@cache.cached(timeout=0)
def home():
    print("To test whether home.html page is served from cache or not")
    return render_template("home.html")


@app.route("/tokenlogin", methods=["GET", "POST"])
@cache.cached(timeout=0)
def tokenlogin():
    print("To test whether tokenlogin.html page is served from cache or not")
    return render_template("tokenlogin.html")

@app.route("/you", methods=["GET", "POST"])
@login_required
@cache.memoize(600)
def you(user = current_user):
    if request.method == "GET":
        print("To test whether you.html page is served from cache or not for ", user)
        return render_template("you.html")

