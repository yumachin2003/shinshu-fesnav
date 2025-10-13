from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///fesData.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

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

    def __repr__(self):
        return f'<Festivals {self.name}>'

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    #app.run(debug=True)