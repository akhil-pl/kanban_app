from .database import db
from flask_security import UserMixin, RoleMixin
from sqlalchemy.orm import relationship # https://docs.sqlalchemy.org/en/14/orm/basic_relationships.html

roles_users = db.Table('roles_users',
        db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
        db.Column('role_id', db.Integer(), db.ForeignKey('role.id')))

class User(db.Model, UserMixin):
    __tablename__ = 'user'
    id = db.Column(db.Integer, autoincrement=True, primary_key=True)
    uname = db.Column(db.String, nullable=False)
    email = db.Column(db.String, nullable=False, unique=True)
    password = db.Column(db.String(255))
    active = db.Column(db.Boolean())
    gender = db.Column(db.String, nullable=False)
    dob = db.Column(db.Integer, nullable=False)
    fs_uniquifier = db.Column(db.String(255), unique = True, nullable=False)
    lists = relationship("List", backref="user", cascade="all, delete") #To delete child tables along with this
    roles = db.relationship('Role', secondary=roles_users, backref=db.backref('users', lazy='dynamic'))


class Role(db.Model, RoleMixin):
    __tablename__ = 'role'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))


class List(db.Model):
    __tablename__ = 'list'
    lid = db.Column(db.Integer, autoincrement=True, primary_key=True)
    uid = db.Column(db.Integer, db.ForeignKey("user.id"), primary_key=True, nullable=False)
    lname = db.Column(db.String, nullable=False)
    description = db.Column(db.String, nullable=False)
    cards = relationship("Card", backref="list", cascade="all, delete") #To delete child tables along with this
    
    
class Card(db.Model):
    __tablename__ = 'card'
    cid = db.Column(db.Integer, autoincrement=True, primary_key=True)
    lid = db.Column(db.Integer, db.ForeignKey("list.lid"), primary_key=True, nullable=False)
    task = db.Column(db.String, nullable=False)
    details = db.Column(db.String)
    create_time = db.Column(db.Integer, nullable=False)
    deadline = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String, nullable=False)
    completion_time = db.Column(db.Integer, nullable=False)

