from . import db, bcrypt
from datetime import datetime


class Festivals(db.Model):
   __tablename__ = 'festivals'
   id = db.Column(db.Integer, primary_key=True)    # 内部番号
   name = db.Column(db.String(80))    # 名前
   date = db.Column(db.Date)   # 開催日
   location = db.Column(db.String(225))    # 場所
   latitude = db.Column(db.Float)    # 緯度
   longitude = db.Column(db.Float)   # 経度
   attendance = db.Column(db.Integer, default=0)   #動員数
   attend_year = db.Column(db.Integer, default=0)
   description = db.Column(db.Text, nullable=True) # 説明

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
           'description': self.description,
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


# ユーザーのお気に入りお祭り
class UserFavorite(db.Model):
    __tablename__ = 'user_favorites'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    festival_id = db.Column(db.Integer, db.ForeignKey('festivals.id'), nullable=False)

    user = db.relationship('User', backref=db.backref('favorites', lazy=True))
    festival = db.relationship('Festivals', backref=db.backref('favorited_by', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'festival_id': self.festival_id
        }

# ユーザーの日記エントリ
class UserDiary(db.Model):
    __tablename__ = 'user_diaries'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    festival_id = db.Column(db.Integer, db.ForeignKey('festivals.id'), nullable=False)
    text = db.Column(db.Text, nullable=True)
    image = db.Column(db.Text, nullable=True) # Base64エンコードされた画像データ
    timestamp = db.Column(db.BigInteger, nullable=False) # JavaScriptのDate.now()に対応
    date = db.Column(db.String(50), nullable=False) # 表示用の日付文字列

    user = db.relationship('User', backref=db.backref('diaries', lazy=True))
    festival = db.relationship('Festivals', backref=db.backref('diaries_for', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'festival_id': self.festival_id,
            'text': self.text,
            'image': self.image,
            'timestamp': self.timestamp,
            'date': self.date
        }

# ユーザーの編集履歴
class EditLog(db.Model):
    __tablename__ = 'edit_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    festival_id = db.Column(db.Integer, nullable=False) # お祭りID
    festival_name = db.Column(db.String(80), nullable=False) # お祭り名 (参照用)
    content = db.Column(db.String(255), nullable=False) # 編集内容
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow) # 編集日時

    user = db.relationship('User', backref=db.backref('edit_logs', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'festival_id': self.festival_id,
            'festival_name': self.festival_name,
            'content': self.content,
            'date': self.date.isoformat() # ISO形式で返す
        }

# お祭りのレビュー
class Review(db.Model):
    __tablename__ = 'reviews'
    id = db.Column(db.Integer, primary_key=True)
    festival_id = db.Column(db.Integer, db.ForeignKey('festivals.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('reviews', lazy=True))
    festival = db.relationship('Festivals', backref=db.backref('reviews', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'festival_id': self.festival_id,
            'user_id': self.user_id,
            'username': self.user.username, # ユーザー名を追加
            'rating': self.rating,
            'comment': self.comment,
            'created_at': self.created_at.isoformat()
        }
