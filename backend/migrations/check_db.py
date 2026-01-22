import sqlite3
import os

# backendディレクトリから実行することを想定
DB_PATH = "instance/fesData.db"

def check_schema():
    if not os.path.exists(DB_PATH):
        print(f"Database not found: {DB_PATH}")
        return

    print(f"Checking database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print(f"\n--- Table: users ---")
    try:
        # SQLiteのPRAGMAコマンドでカラム情報を取得
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        # cid, name, type, notnull, dflt_value, pk
        print(f"{'Name':<20} {'Type':<15} {'NotNull':<10}")
        print("-" * 50)
        for col in columns:
            cid, name, dtype, notnull, dflt, pk = col
            print(f"{name:<20} {dtype:<15} {notnull:<10}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_schema()