from flask import render_template, request, redirect, url_for, Blueprint
from datetime import datetime
from . import db
from .models import Festivals

main_bp = Blueprint('main', __name__)

@main_bp.route('/add', methods=['GET', 'POST'])
def add_festival():
    if request.method == 'POST':
        fesName = request.form['name']
        fesDate_str = request.form['date']
        fesLocation = request.form['location']

        try:
            fesDate = datetime.strptime(fesDate_str, '%Y-%m-%d').date()
        except ValueError:
            return "日付の形式が不正です。YYYY-MM-DD 形式で入力してください。", 400

        new_festival = Festivals(
            name=fesName,
            date=fesDate,
            location=fesLocation,
        )

        try:
            db.session.add(new_festival)
            db.session.commit()
            return redirect(url_for('main.add_festival'))
        except Exception as e:
            db.session.rollback()
            return f"データ登録中にエラーが発生しました: {e}", 500

    return render_template('add_festival.html')

@main_bp.route('/')
def index():
    festivals = Festivals.query.all()
    return render_template('index.html', festivals=festivals)