from . import db, bcrypt


class Festivals(db.Model):
   __tablename__ = 'festivals'
   id = db.Column(db.Integer, primary_key=True)    # 内部番号
   name = db.Column(db.String(80), unique=True)    # 名前
   date = db.Column(db.Date)   # 開催日
   location = db.Column(db.String(225))    # 場所
   latitude = db.Column(db.Float)    # 緯度
   longitude = db.Column(db.Float)   # 経度
   attendance = db.Column(db.Integer, default=0)   #動員数
   attend_year = db.Column(db.Integer, default=0)

   # JSONに変換するためのヘルパーメソッド
   def to_dict(self):
       return {
           'id': self.id,
           'name': self.name,
           'date': self.date.strftime('%Y-%m-%d') if self.date else None,
           'location': self.location,
           'latitude': self.latitude,
           'longitude': self.longitude,
           'attendance': self.attendance,
           'attend_year': self.attend_year,
       }

class User(db.Model):
   __tablename__ = 'users'
   id = db.Column(db.Integer, primary_key=True)
   username = db.Column(db.String(80), unique=True, nullable=False)
   password_hash = db.Column(db.String(128), nullable=False)

   def __init__(self, username, password):
       """コンストラクタ。パスワードをハッシュ化して保存する"""
       self.username = username
       self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

   def check_password(self, password):
       """パスワードが一致するかチェックする"""
       return bcrypt.check_password_hash(self.password_hash, password)
