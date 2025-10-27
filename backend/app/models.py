from . import db

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

   def to_dict(self):
      return {
         'id': self.id,
         'name': self.name,
         # dateオブジェクトは文字列に変換しないとJSONにできない
         'date': self.date.strftime('%Y-%m-%d') if self.date else None,
         'location': self.location,
         'latitude': self.latitude,
         'longitude': self.longitude,
         'attendance': self.attendance,
         'attend_year': self.attend_year,
      }
