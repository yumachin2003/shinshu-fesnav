import sqlite3
import os

# backendディレクトリから実行することを想定
DB_PATH = "instance/fesData.db"

def cleanup():
    if not os.path.exists(DB_PATH):
        print(f"Database file not found: {DB_PATH}")
        return

    print(f"Connecting to {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # _alembic_tmp_users テーブルが存在するか確認
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='_alembic_tmp_users'")
        if cursor.fetchone():
            print("Found '_alembic_tmp_users'. Dropping it...")
            cursor.execute("DROP TABLE _alembic_tmp_users")
            conn.commit()
            print("Dropped '_alembic_tmp_users' successfully.")
        else:
            print("Table '_alembic_tmp_users' not found. No action needed.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    cleanup()