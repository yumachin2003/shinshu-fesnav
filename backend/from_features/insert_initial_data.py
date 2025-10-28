import sqlite3

# データベースファイルに接続
conn = sqlite3.connect('matsuri.db')
cursor = conn.cursor()

# 挿入するお祭りのデータリスト
matsuris_to_add = [
    ('諏訪湖祭湖上花火大会', '毎年8月15日', '諏訪湖畔（長野県諏訪市）', 'JR上諏訪駅から徒歩10分', 500000),
    ('お舟祭り', '毎年10月第3日曜', '神明神社（長野県辰野町）', 'JR辰野駅から徒歩20分', 10000),
    ('飯山灯篭まつり', '毎年8月上旬', '飯山駅周辺（長野県飯山市）', 'JR飯山駅よりすぐ', 15000)
]

# データの挿入を実行
cursor.executemany('''
    INSERT INTO festivals (name, date, location, access, attendees)
    VALUES (?, ?, ?, ?, ?)
''', matsuris_to_add)

conn.commit() # 変更を確定
conn.close() # 接続を閉じる

print("✅ お祭りデータがデータベースに挿入されました。")