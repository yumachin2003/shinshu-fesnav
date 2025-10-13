from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

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

@app.route('/add', methods=['GET', 'POST'])
def add_festival():
    if request.method == 'POST':
        fesName = request.form['name']
        fesDate_str = request.form['date']
        fesLocation = request.form['location']

        try: fesDate = datetime.strptime(fesDate_str, '%Y-%m-%d').date()
        except ValueError: return "日付の形式が不正です。YYYY-MM-DD 形式で入力してください。", 400

        new_festival = Festivals(
            name=fesName,
            date=fesDate,
            location=fesLocation,
        )

        try:
            db.session.add(new_festival)
            db.session.commit()
            return redirect(url_for('add_festival')) 
        except Exception as e:
            db.session.rollback()
            return f"データ登録中にエラーが発生しました: {e}", 500
    
    return render_template('add_festival.html')
    
@app.route('/')
def index():
    festivals = Festivals.query.all()
    return render_template('index.html', festivals=festivals)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)