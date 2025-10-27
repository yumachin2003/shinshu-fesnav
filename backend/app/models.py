from . import db

#class Festivals(db.Model):
#    __tablename__ = 'festivals'
#    id = db.Column(db.Integer, primary_key=True)    # 内部番号
#    name = db.Column(db.String(80), unique=True)    # 名前
#    date = db.Column(db.Date)   # 開催日
#    location = db.Column(db.String(225))    # 場所
#    latitude = db.Column(db.Float)    # 緯度
#    longitude = db.Column(db.Float)   # 経度
#    attendance = db.Column(db.Integer, default=0)   #動員数
#    attend_year = db.Column(db.Integer, default=0)

class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)

    # データをJSON形式（辞書）で返しやすくするためのヘルパー関数
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }