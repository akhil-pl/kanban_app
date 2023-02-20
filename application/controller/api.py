from flask_restful import Resource
from flask_restful import fields, marshal_with
from flask_restful import reqparse
from flask import current_app as app #for logging
from flask_security import auth_required
from time import perf_counter_ns


from application.data.database import db
from application.data.models import User, List, Card
from application.utils.validation import NotFoundError, UserValidationError, SchemaValidationError
from application.jobs import tasks
from application.data import data_access


# all output formats as in API schemas
useremail_fields = {"email" : fields.String}
user_fields = {"id"  : fields.Integer,
                "uname" : fields.String,
                "email" : fields.String,
                "password"   : fields.String,
                "gender"   : fields.String,
                "dob"   : fields.String}
list_fields = {"lid"  : fields.Integer,
                "lname" : fields.String,
                "description" : fields.String}
lists_fields = {"lists": fields.List(fields.Nested(list_fields))}
userlists_fields = {"useremail"  : fields.Nested(useremail_fields),
                    "lists": fields.Nested(lists_fields)}
card_fields = {"cid"  : fields.Integer,
                "lid" : fields.Integer,
                "task" : fields.String,
                "details" : fields.String,
                "create_time" : fields.String,  #need to change to DateTime format curresponding to format of the form
                "deadline" : fields.String,  #need to change to DateTime format curresponding to format of the form
                "status" : fields.Boolean,  #need to change to proper format format
                "completion_time" : fields.String}  #need to change to DateTime format curresponding to format of the form
cards_fields = {"cards": fields.List(fields.Nested(card_fields))}
detailedlist_fields = {"user" : fields.Nested(useremail_fields),
                    "list" : fields.Nested(list_fields),
                    "cards" : fields.Nested(card_fields)}
detailedlists_fields = {"detailedlists": fields.List(fields.Nested(detailedlist_fields))}




create_user_parser = reqparse.RequestParser()
create_user_parser.add_argument('uname')
create_user_parser.add_argument('email')
create_user_parser.add_argument('password')
create_user_parser.add_argument('gender')
create_user_parser.add_argument('dob')

update_user_parser = reqparse.RequestParser()
update_user_parser.add_argument('uname')
update_user_parser.add_argument('gender')
update_user_parser.add_argument('dob')



class UserAPI(Resource):
    def post(self): #cannot find way to hash the submitted password yet. So not adviced to add user from API
        args = create_user_parser.parse_args()
        uname = args.get("uname", None)
        email = args.get("email", None)
        password = args.get("password", None)
        gender = args.get("gender", None)
        dob = args.get("dob", None)
        fs_uniquifier = "dfkjhfkjhiuhhfjkhfkjnkjbvb" #Need to use a random code generator
        active = 1

        if uname is None:
            raise UserValidationError(status_code=400, error_code="U1001", error_message="username required")

        if email is None:
            raise UserValidationError(status_code=400, error_code="U1002", error_message="email required")
        
        if "@" in email:
            pass
        else:
            raise UserValidationError(status_code=400, error_code="U1003", error_message="invalid email")

        user = db.session.query(User).filter(User.email == email).first()
        if user:
            raise UserValidationError(status_code=400, error_code="U1004", error_message="duplicate email")

        new_user = User(uname=uname, email=email, password=password, active=active, gender=gender, dob=dob, fs_uniquifier=fs_uniquifier)
        db.session.add(new_user)
        db.session.commit()
        return "", 201



    @auth_required("token")
    @marshal_with(user_fields)
    def get(self, email): #Get details of a user
        user = db.session.query(User).filter(User.email == email).first() #First not nescessary as email constraint is unique
        if user: # if user exist return it in JASON format otherwise return error code
            return user # Format the return JASON
        else:
            raise NotFoundError(status_code=404) # because marshel will try jason even for null user

    @marshal_with(user_fields)
    def put(self, email): #Update details of a user (only uname, gender and dob only)
        args = update_user_parser.parse_args()
        uname = args.get("uname", None)
        gender = args.get("gender", None)
        dob = args.get("dob", None)

        if uname is None:
            raise UserValidationError(status_code=400, error_code="U1001", error_message="username required")

        user = db.session.query(User).filter(User.email == email).first()#Check wether the user exists
        if user is None:
            raise NotFoundError(status_code=404)#Return error if the user does not exist
        user.uname = uname
        user.gender = gender
        user.dob = dob
        db.session.add(user)
        db.session.commit()
        return user

    
    def delete(self, email): #Delete an user along with all list and cards belonging to the user
        user = db.session.query(User).filter(User.email == email).first() #Check wether the user exists
        if user is None:
            raise NotFoundError(status_code=404)#Return error if the user does not exist
        db.session.delete(user) 
        db.session.commit()
        return "", 200



create_list_parser = reqparse.RequestParser()
create_list_parser.add_argument('lname')
create_list_parser.add_argument('description')

update_list_parser = reqparse.RequestParser()
update_list_parser.add_argument('lname')
update_list_parser.add_argument('description')

class ListAPI(Resource):
    def post(self, email): #This is for creating new list for an user
        args = create_list_parser.parse_args()
        lname = args.get("lname", None)
        description = args.get("description", None)

        if lname is None:
            raise UserValidationError(status_code=400, error_code="T1001", error_message="list name is required")

        user = db.session.query(User).filter(User.email == email).first()
        if user is None:
            raise NotFoundError(status_code=404)#Return error if the user does not exist
        uid = user.id

        #ERROR HANDLER FOR CHECKING WHEATHER THIS USER HAVE ANOTHER LIST OF SAME NAME
        list = db.session.query(List).filter(List.lname == lname, List.uid == uid).first()
        if list:
            raise SchemaValidationError(status_code=400, error_code="L1003", error_message="Same list name exist for this user")

        new_list = List(uid=uid, lname=lname, description=description)
        db.session.add(new_list)
        db.session.commit() 
        data_access.delete_memoized_lists(uid) #To delete the cashed lists of this user as list is updated
        return "", 201
        
    @marshal_with(list_fields)
    def get(self, email, lname): #Get details of a list
        user = db.session.query(User).filter(User.email == email).first() #First not nescessary as email constraint is unique
        if user is None:
            raise NotFoundError(status_code=404)#Return error if the user does not exist
        uid = user.id
        list = db.session.query(List).filter(List.lname == lname, List.uid == uid).first()
        if list: # if list exist return it in JASON format otherwise return error code
            return list # Format the return JASON
        else:
            raise NotFoundError(status_code=404) # because marshel will try jason even for null user

    @marshal_with(list_fields)
    def put(self, email, lname): #Update details of a list
        args = update_list_parser.parse_args()
        nlname = args.get("lname", None)
        description = args.get("description", None)

        user = db.session.query(User).filter(User.email == email).first() #First not nescessary as email constraint is unique
        if user is None:
            raise NotFoundError(status_code=404)#Return error if the user does not exist
        uid = user.id
        list = db.session.query(List).filter(List.lname == lname, List.uid == uid).first()
        if list is None:
            raise NotFoundError(status_code=404)#Return error if the user does not have that lname
        if (nlname != lname): #Check if user already have list of same name
            nlist = db.session.query(List).filter(List.lname == nlname, List.uid == uid).first()
            if nlist:
                raise SchemaValidationError(status_code=400, error_code="L1003", error_message="Same list name exist for this user")

        list.lname = nlname
        list.description = description
        db.session.add(list)
        db.session.commit()
        data_access.delete_memoized_lists(uid) #To delete the cashed lists of this user as list is updated
        return list

    def delete(self, email, lname): #Delete an list along with all cards belonging to the user
        user = db.session.query(User).filter(User.email == email).first() #First not nescessary as email constraint is unique
        if user is None:
            raise NotFoundError(status_code=404)#Return error if the user does not exist
        uid = user.id
        list = db.session.query(List).filter(List.lname == lname, List.uid == uid).first()
        if list is None:
            raise NotFoundError(status_code=404)#Return error if the list does not exist for the user

        db.session.delete(list) 
        db.session.commit()
        data_access.delete_memoized_lists(uid) #To delete the cashed lists of this user as list is updated
        return "", 200


create_card_parser = reqparse.RequestParser()
create_card_parser.add_argument('task')
create_card_parser.add_argument('details')
create_card_parser.add_argument('create_time')
create_card_parser.add_argument('deadline')

update_card_parser = reqparse.RequestParser()
update_card_parser.add_argument('lid')
update_card_parser.add_argument('task')
update_card_parser.add_argument('details')
update_card_parser.add_argument('create_time')
update_card_parser.add_argument('deadline')
update_card_parser.add_argument('status')
update_card_parser.add_argument('completion_time')

class CardAPI(Resource):
    def post(self, email, lname): #This is for creating new card inside a list
        args = create_card_parser.parse_args()
        task = args.get("task", None)
        details = args.get("details", None)
        create_time = args.get("create_time", None)
        deadline = args.get("deadline", None)
        status = False

        if task is None:
            raise UserValidationError(status_code=400, error_code="C1001", error_message="task name is required")
        if deadline is None:
            raise UserValidationError(status_code=400, error_code="C1002", error_message="deadline is required")
        #time = deadline - create_time
        #Should check whether deadline is greater than create_time

        user = db.session.query(User).filter(User.email == email).first()
        if user is None:
            raise NotFoundError(status_code=404)#Return error if the user does not exist
        uid = user.id
        list = db.session.query(List).filter(List.lname == lname, List.uid == uid).first()
        if list is None:
            raise NotFoundError(status_code=404)#Return error if the list does not exist for the user
        lid = list.lid

        #ERROR HANDLER FOR CHECKING WHEATHER THIS USER HAVE ANOTHER LIST OF SAME NAME
        card = db.session.query(Card).filter(Card.lid == lid, Card.task == task).first()
        if card:
            raise SchemaValidationError(status_code=400, error_code="C1003", error_message="Same task name exist in this list")

        new_card = Card(lid=lid, task=task, details=details, create_time=create_time, deadline=deadline, status=status)
        db.session.add(new_card)
        db.session.commit() 
        data_access.delete_memoized_cards(lid) #To delete the cashed cards of this list as card is updated
        return "", 201
        
    @marshal_with(card_fields)
    def get(self, email, lname, task): #Get details of a card
        user = db.session.query(User).filter(User.email == email).first() #First not nescessary as email constraint is unique
        if user is None:
            raise NotFoundError(status_code=404) #Return error if the user does not exist
        uid = user.id
        list = db.session.query(List).filter(List.lname == lname, List.uid == uid).first()
        if list is None:
            raise NotFoundError(status_code=404) #Return error if the list does not exist for the user
        lid = list.lid
        card = db.session.query(Card).filter(Card.lid == lid, Card.task == task).first()
        if card:
            return card # Format the return JASON
        else:
            raise NotFoundError(status_code=404) # because marshel will try jason even for null user

    @marshal_with(card_fields)
    def put(self, email, lname, task): #Update details of a card, including changing to another list of the same user
        args = update_card_parser.parse_args()
        lid = args.get("lid", None)
        ctask = args.get("task", None)
        details = args.get("details", None)
        deadline = args.get("deadline", None)
        status = args.get("status", None)
        completion_time = args.get("completion_time", None)

        if ctask is None:
            raise UserValidationError(status_code=400, error_code="C1001", error_message="task name is required")
        if deadline is None:
            raise UserValidationError(status_code=400, error_code="C1002", error_message="deadline is required")
        #time = deadline - create_time
        #Should check whether deadline is greater than create_time

        user = db.session.query(User).filter(User.email == email).first() #First not nescessary as email constraint is unique
        if user is None:
            raise NotFoundError(status_code=404)#Return error if the user does not exist
        uid = user.id
        list = db.session.query(List).filter(List.lname == lname, List.uid == uid).first()
        if list is None:
            raise NotFoundError(status_code=404) #Return error if the list does not exist for the user
        olid = list.lid
        card = db.session.query(Card).filter(Card.lid == olid, Card.task == task).first()
        if card is None:
            raise NotFoundError(status_code=404) #Return error if the card does not exist in the list

        if olid != lid: #To check whether the user is owner of the list to which it is changing to
            list = db.session.query(List).filter(List.lid == lid, List.uid == uid).first()
            if list is None:
                raise UserValidationError(status_code=400, error_code="C1003", error_message="user doesnt have such a list")
        
            
        card.lid = lid
        card.task = ctask
        card.details = details
        card.deadline = deadline
        card.status = status
        card.completion_time = completion_time
        db.session.add(card)
        db.session.commit()
        data_access.delete_memoized_cards_all() #To delete all cashed cards (As deleting only two list is causing one to not work)
        # data_access.delete_memoized_cards(olid) #To delete the cashed cards of this list as card is updated
        # data_access.delete_memoized_cards(lid) #To delete the cashed cards of this list as card is updated
        return card

    def delete(self, email, lname, task): #Delete a card
        user = db.session.query(User).filter(User.email == email).first() #First not nescessary as email constraint is unique
        if user is None:
            raise NotFoundError(status_code=404)#Return error if the user does not exist
        uid = user.id
        list = db.session.query(List).filter(List.lname == lname, List.uid == uid).first()
        if list is None:
            raise NotFoundError(status_code=404)#Return error if the user does not exist
        lid = list.lid
        card = db.session.query(Card).filter(Card.lid == lid, Card.task == task).first()
        if card is None:
            raise NotFoundError(status_code=404) #Return error if the card does not exist in the list

        db.session.delete(card) 
        db.session.commit()
        data_access.delete_memoized_cards(lid) #To delete the cashed cards of this list as card is updated
        return "", 200

class SummaryAPI(Resource): 
    @auth_required("token")       
    @marshal_with(list_fields)
    def get(self, email): #Get lists of a user
        user = db.session.query(User).filter(User.email == email).first() #First not nescessary as email constraint is unique
        if user is None:
            raise NotFoundError(status_code=404) #Return error if the user does not exist
        uid = user.id
        start = perf_counter_ns()
        list = data_access.get_all_lists_of_user(uid)
        stop = perf_counter_ns()
        print("Time taken to get user list", stop-start)
        if list is None:
            raise NotFoundError(status_code=404) #Return error if the list does not exist for the user
        return list
    
class SummarycardAPI(Resource): 
    @auth_required("token")       
    @marshal_with(card_fields)
    def get(self, email, lname): #Get details of a list
        user = db.session.query(User).filter(User.email == email).first() #First not nescessary as email constraint is unique
        if user is None:
            raise NotFoundError(status_code=404) #Return error if the user does not exist
        uid = user.id
        list = db.session.query(List).filter(List.uid == uid, List.lname == lname).first()
        if list is None:
            raise NotFoundError(status_code=404) #Return error if the list does not exist for the user
        lid = list.lid
        # start = perf_counter_ns()
        card = data_access.get_all_cards_of_list(lid)
        # stop = perf_counter_ns()
        # print("Time taken to get card in", lid, stop-start)
        if card is None:
            raise NotFoundError(status_code=404) #Return error if the list does not exist for the user
        return card
    
class ExportAPI(Resource):
    def get(self, email): #User trigered task to send a csv file
        tasks.export_csv(email)
        return "", 200

class ExportListAPI(Resource):
    def get(self, email, lname): #User trigered task to send a csv file of a list
        tasks.export_list_csv(email=email, lname=lname)
        return "", 200