from application.data.models import List, Card
from application.data.database import db
from main import cache

@cache.memoize(600)
def get_all_lists_of_user(uid):
    list = db.session.query(List).filter(List.uid == uid).order_by(List.lname).all()
    return list

@cache.memoize(600)
def get_all_cards_of_list(lid):
    card = db.session.query(Card).filter(Card.lid == lid).order_by(Card.deadline).all()
    return card

def delete_memoized_lists(uid):
    cache.delete_memoized(get_all_lists_of_user, uid)

def delete_memoized_cards(lid):
    cache.delete_memoized(get_all_cards_of_list, lid)

def delete_memoized_cards_all():
    cache.delete_memoized(get_all_cards_of_list)