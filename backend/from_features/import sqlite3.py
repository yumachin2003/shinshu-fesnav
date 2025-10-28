import sqlite3

# 1. データベースに接続（ファイルがなければ新規作成される）
# ファイル名: matsuri.db
conn = sqlite3.connect('matsuri.db')
cursor = conn.cursor()

# 2. SQL文を使ってテーブルを作成
# PRIMARY KEYは主キー（その行を一意に特定する列）
# NOT NULLはデータの挿入時に空欄を許可しない設定
cursor.execute('''
    CREATE TABLE IF NOT EXISTS festivals (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        date TEXT,
        location TEXT,
        access TEXT,
        attendees INTEGER
    )
''')

# 3. データの変更（テーブル作成）を確定（コミット）
conn.commit()

# 4. データベースとの接続を閉じる
conn.close()

print("✅ matsuri.db ファイルと festivals テーブルが正常に作成されました。")