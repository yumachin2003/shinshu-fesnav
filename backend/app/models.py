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
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), unique=True, nullable=False)

    # メールアドレス
    email = db.Column(db.String(120), unique=True, nullable=True)

    # ローカルログイン用（Googleログインでは NULL）
    password_hash = db.Column(db.String(255), nullable=True)

    # Google 表示名
    display_name = db.Column(db.String(120), nullable=True)

    # ⭐ LINEログイン用
    line_user_id = db.Column(db.String(255), unique=True, nullable=True)

    # ⭐ Googleログイン用
    google_user_id = db.Column(db.String(255), unique=True, nullable=True)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        if not self.password_hash:
            return False
        return bcrypt.check_password_hash(self.password_hash, password)

class Passkey(db.Model):
    __tablename__ = "passkeys"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    credential_id = db.Column(db.String(255), unique=True, nullable=False)
    public_key = db.Column(db.LargeBinary, nullable=False)
    sign_count = db.Column(db.Integer, default=0)
    transports = db.Column(db.String(255), nullable=True)

class UserFavorite(db.Model):
    __tablename__ = "user_favorites"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    festival_id = db.Column(db.Integer, db.ForeignKey("festivals.id"), nullable=False)

    user = db.relationship("User", backref=db.backref("favorites", lazy=True))
    festival = db.relationship("Festivals", backref=db.backref("favorited_by", lazy=True))

class EditLog(db.Model):
    __tablename__ = "edit_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    festival_id = db.Column(db.Integer, nullable=False)
    festival_name = db.Column(db.String(80), nullable=False)
    content = db.Column(db.String(255), nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("edit_logs", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "festival_id": self.festival_id,
            "festival": self.festival_name,  # Account.js の表示に合わせる
            "content": self.content,
            "date": self.date.strftime("%Y-%m-%d %H:%M:%S") if self.date else None
        }


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

    def to_dict(self):
        return {
            "id": self.id,
            "festival_id": self.festival_id,
            "user_id": self.user_id,
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "username": self.user.username if self.user else "Unknown"
        }

class InformationSubmission(db.Model):
    __tablename__ = "information_submissions"

    id = db.Column(db.Integer, primary_key=True)
    festival_id = db.Column(db.Integer, nullable=True)
    festival_name = db.Column(db.String(120), nullable=True)

    title = db.Column(db.String(120), nullable=False)
    content = db.Column(db.Text, nullable=False)

    submitter_name = db.Column(db.String(120), nullable=True)
    submitter_email = db.Column(db.String(255), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_checked = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "festival_id": self.festival_id,
            "festival_name": self.festival_name,
            "title": self.title,
            "content": self.content,
            "submitter_name": self.submitter_name,
            "submitter_email": self.submitter_email,
            "created_at": self.created_at.isoformat(),
            "is_checked": self.is_checked,
        }