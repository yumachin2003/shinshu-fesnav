from . import db, bcrypt
from datetime import datetime


class Festivals(db.Model):
    __tablename__ = "festivals"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80))
    date = db.Column(db.Date)
    location = db.Column(db.String(225))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    attendance = db.Column(db.Integer, default=0)
    attend_year = db.Column(db.Integer, default=0)
    description = db.Column(db.Text, nullable=True)
    access = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "date": self.date.strftime("%Y-%m-%d") if self.date else None,
            "location": self.location,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "attendance": self.attendance,
            "attend_year": self.attend_year,
            "description": self.description,
            "access": self.access,
        }


class User(db.Model):
    __tablename__ = "users"  # ★ 明示する（超重要）

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), unique=True, nullable=False)

    # ローカルログイン用（Googleログインでは NULL）
    password_hash = db.Column(db.String(255), nullable=True)

    # Google 表示名
    display_name = db.Column(db.String(120), nullable=True)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        if not self.password_hash:
            return False
        return bcrypt.check_password_hash(self.password_hash, password)


class UserFavorite(db.Model):
    __tablename__ = "user_favorites"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    festival_id = db.Column(db.Integer, db.ForeignKey("festivals.id"), nullable=False)

    user = db.relationship("User", backref=db.backref("favorites", lazy=True))
    festival = db.relationship("Festivals", backref=db.backref("favorited_by", lazy=True))


class UserDiary(db.Model):
    __tablename__ = "user_diaries"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    festival_id = db.Column(db.Integer, db.ForeignKey("festivals.id"), nullable=False)

    text = db.Column(db.Text, nullable=True)
    image = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.BigInteger, nullable=False)
    date = db.Column(db.String(50), nullable=False)

    user = db.relationship("User", backref=db.backref("diaries", lazy=True))
    festival = db.relationship("Festivals", backref=db.backref("diaries_for", lazy=True))

    # 🔹 追加: to_dict メソッド
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "festival_id": self.festival_id,
            "text": self.text,
            "image": self.image,
            "timestamp": self.timestamp,
            "date": self.date
        }

class EditLog(db.Model):
    __tablename__ = "edit_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    festival_id = db.Column(db.Integer, nullable=False)
    festival_name = db.Column(db.String(80), nullable=False)
    content = db.Column(db.String(255), nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("edit_logs", lazy=True))


class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)
    festival_id = db.Column(db.Integer, db.ForeignKey("festivals.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("reviews", lazy=True))
    festival = db.relationship("Festivals", backref=db.backref("reviews", lazy=True))
