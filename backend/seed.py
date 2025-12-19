import json
import urllib.request
import urllib.error

# --- 設定 ---
# サーバーのURL
BASE_URL = "http://127.0.0.1:5051"
API_URL = f"{BASE_URL}/api/festivals"
LOGIN_URL = f"{BASE_URL}/api/login"

# ログイン情報 (ご自身のrootユーザーのパスワードに置き換えてください)
# USERNAME = "ynokura"
# PASSWORD = "0522" # <-- 変更してください
USERNAME = "root"
PASSWORD = "password" # <-- 変更してください


# 信州のお祭りデータリスト
festivals_data = [
    {
        "name": "善光寺御開帳",
        "date": "2027-04-01",
        "location": "長野市",
        "description": "数え年で7年に一度、絶対秘仏の御本尊の御身代わり「前立本尊」を本堂にお迎えして行う壮大な行事。",
        "image_url": "",
        "access": "JR長野駅からバスで約15分「善光寺大門」下車",
        "attendance": 6000000,
        "latitude": 36.6616,
        "longitude": 138.1878
    },
    {
        "name": "御柱祭 (上社山出し)",
        "date": "2028-04-01",
        "location": "諏訪市・茅野市",
        "description": "7年に一度、寅と申の年に行われる天下の奇祭。巨木を山から曳き出し、社殿の四隅に建てる。",
        "image_url": "",
        "access": "JR茅野駅から徒歩またはシャトルバス",
        "attendance": 200000,
        "latitude": 35.9912,
        "longitude": 138.1296
    },
    {
        "name": "長野びんずる",
        "date": "2025-08-02",
        "location": "長野市",
        "description": "長野市最大の夏祭り。善光寺の「びんずる尊者」にちなみ、しゃもじを打ち鳴らしながら踊る「びんずる踊り」がメイン。",
        "image_url": "",
        "access": "JR長野駅から徒歩",
        "attendance": 200000,
        "latitude": 36.6431,
        "longitude": 138.1886
    },
    {
        "name": "松本ぼんぼん",
        "date": "2025-08-09",
        "location": "松本市",
        "description": "松本市の中心市街地で行われる夏祭り。参加連が「ぼんぼん松本ぼんぼんぼん」の曲に合わせて踊り歩く。",
        "image_url": "",
        "access": "JR松本駅から徒歩",
        "attendance": 200000,
        "latitude": 36.2307,
        "longitude": 137.9644
    },
    {
        "name": "諏訪湖祭湖上花火大会",
        "date": "2025-08-15",
        "location": "諏訪市",
        "description": "打上数、規模ともに全国屈指の花火大会。四方を山に囲まれた諏訪湖ならではの音響効果も魅力。",
        "image_url": "",
        "access": "JR上諏訪駅から徒歩約10分",
        "attendance": 500000,
        "latitude": 36.0477,
        "longitude": 138.1126
    },
    {
        "name": "全国新作花火競技大会",
        "date": "2025-09-06",
        "location": "諏訪市",
        "description": "全国の若手花火師が独自の斬新な花火を競う大会。諏訪湖で開催される。",
        "image_url": "",
        "access": "JR上諏訪駅から徒歩約10分",
        "attendance": 300000,
        "latitude": 36.0477,
        "longitude": 138.1126
    },
    {
        "name": "上田わっしょい",
        "date": "2025-07-19",
        "location": "上田市",
        "description": "上田市の夏祭り。生歌・生演奏に合わせて踊るスタイルが特徴。",
        "image_url": "",
        "access": "JR上田駅から徒歩",
        "attendance": 100000,
        "latitude": 36.3966,
        "longitude": 138.2498
    },
    {
        "name": "岡谷太鼓まつり",
        "date": "2025-08-13",
        "location": "岡谷市",
        "description": "300人揃い打ちなど、迫力ある太鼓の演奏が楽しめる祭り。",
        "image_url": "",
        "access": "JR岡谷駅から徒歩約5分",
        "attendance": 50000,
        "latitude": 36.0624,
        "longitude": 138.0435
    },
    {
        "name": "野沢温泉の道祖神祭り",
        "date": "2025-01-15",
        "location": "野沢温泉村",
        "description": "日本三大火祭りの一つ。国の重要無形民俗文化財。厄年の男衆と村人が火を巡って攻防する。",
        "image_url": "",
        "access": "JR飯山駅から直通バス「野沢温泉ライナー」で約25分",
        "attendance": 5000,
        "latitude": 36.9227,
        "longitude": 138.4496
    },
    {
        "name": "奈良井宿アイスキャンドル祭り",
        "date": "2025-02-03",
        "location": "塩尻市",
        "description": "宿場町・奈良井宿の古い町並みをアイスキャンドルの灯りが照らす幻想的なイベント。",
        "image_url": "",
        "access": "JR奈良井駅から徒歩",
        "attendance": 2000,
        "latitude": 35.9663,
        "longitude": 137.8129
    },
    {
        "name": "穂高神社御船祭り",
        "date": "2025-09-27",
        "location": "安曇野市",
        "description": "穂高神社の例大祭。大人船と子供船がぶつかり合う勇壮な祭り。",
        "image_url": "",
        "access": "JR穂高駅から徒歩",
        "attendance": 20000,
        "latitude": 36.3396,
        "longitude": 137.8847
    },
    {
        "name": "長野えびす講煙火大会",
        "date": "2025-11-23",
        "location": "長野市",
        "description": "全国でも珍しい11月の花火大会。澄んだ秋の夜空を彩る。",
        "image_url": "",
        "access": "JR長野駅からシャトルバス",
        "attendance": 400000,
        "latitude": 36.638,
        "longitude": 138.185
    },
    {
        "name": "佐久バルーンフェスティバル",
        "date": "2025-05-03",
        "location": "佐久市",
        "description": "色とりどりの熱気球が空を舞う、ゴールデンウィークの恒例イベント。",
        "image_url": "",
        "access": "JR佐久平駅から車で15分",
        "attendance": 300000,
        "latitude": 36.253,
        "longitude": 138.456
    },
    {
        "name": "木曽漆器祭・奈良井宿場祭",
        "date": "2025-06-06",
        "location": "塩尻市",
        "description": "木曽平沢の漆器市場と奈良井宿の時代行列が行われる。",
        "image_url": "",
        "access": "JR木曽平沢駅から徒歩",
        "attendance": 50000,
        "latitude": 35.983,
        "longitude": 137.833
    },
    {
        "name": "小諸市民まつり「ドカンショ」",
        "date": "2025-08-02",
        "location": "小諸市",
        "description": "「ドカンショ」という掛け声とともに踊り歩く市民祭り。",
        "image_url": "",
        "access": "JR小諸駅から徒歩",
        "attendance": 30000,
        "latitude": 36.327,
        "longitude": 138.423
    },
    {
        "name": "飯田りんごん",
        "date": "2025-08-02",
        "location": "飯田市",
        "description": "飯田市の中心市街地で行われる夏祭り。",
        "image_url": "",
        "access": "JR飯田駅から徒歩",
        "attendance": 50000,
        "latitude": 35.519,
        "longitude": 137.821
    },
    {
        "name": "安曇野花火",
        "date": "2025-08-14",
        "location": "安曇野市",
        "description": "犀川河川敷で行われる花火大会。音楽と花火のコラボレーションが魅力。",
        "image_url": "",
        "access": "JR明科駅から徒歩20分",
        "attendance": 20000,
        "latitude": 36.353,
        "longitude": 137.925
    },
    {
        "name": "軽井沢ウィンターフェスティバル",
        "date": "2025-12-01",
        "location": "軽井沢町",
        "description": "冬の軽井沢を彩るイルミネーションやイベント。",
        "image_url": "",
        "access": "JR軽井沢駅から徒歩",
        "attendance": 100000,
        "latitude": 36.342,
        "longitude": 138.635
    },
    {
        "name": "上高地開山祭",
        "date": "2025-04-27",
        "location": "松本市",
        "description": "北アルプスの観光シーズン幕開けを告げる神事。",
        "image_url": "",
        "access": "新島々駅からバス",
        "attendance": 3000,
        "latitude": 36.249,
        "longitude": 137.637
    },
    {
        "name": "飯田お練りまつり",
        "date": "2029-03-25",
        "location": "飯田市",
        "description": "7年に一度、諏訪大社の御柱祭の寅・申の年に行われる飯田最大の祭り。東野大宮神社の獅子舞などが街を練り歩く。",
        "image_url": "",
        "access": "JR飯田駅から徒歩",
        "attendance": 200000,
        "latitude": 35.514,
        "longitude": 137.824
    },
    {
        "name": "戸隠そば祭り",
        "date": "2025-11-01",
        "location": "長野市",
        "description": "新そばの季節に戸隠で開催される祭り。「半ざる食べ歩き」手形を手に、戸隠のそば店を巡る。",
        "image_url": "",
        "access": "JR長野駅からバスで約1時間",
        "attendance": 10000,
        "latitude": 36.75,
        "longitude": 138.08
    },
    {
        "name": "松代藩真田十万石まつり",
        "date": "2025-10-11",
        "location": "長野市",
        "description": "真田氏の城下町・松代で行われる時代祭り。真田鉄砲隊の演武や、武者行列が見どころ。",
        "image_url": "",
        "access": "JR長野駅からバスで約30分",
        "attendance": 30000,
        "latitude": 36.575,
        "longitude": 138.195
    },
    {
        "name": "氷雪の灯祭り（木曽路氷雪の祭り）",
        "date": "2025-01-25",
        "location": "木曽町",
        "description": "木曽路の宿場町がアイスキャンドルの灯りで幻想的に照らされる冬のイベント。",
        "image_url": "",
        "access": "JR木曽福島駅からバス",
        "attendance": 5000,
        "latitude": 35.84,
        "longitude": 137.69
    },
    {
        "name": "いいやま雪まつり",
        "date": "2025-02-08",
        "location": "飯山市",
        "description": "豪雪地帯ならではの巨大な雪像が立ち並ぶ雪の祭典。雪像コンクールやイベントが多数開催される。",
        "image_url": "",
        "access": "JR飯山駅から徒歩",
        "attendance": 50000,
        "latitude": 36.85,
        "longitude": 138.36
    }
]

def login():
    """APIにログインしてアクセストークンを取得する"""
    print("ログインを試行します...")
    login_data = {
        "username": USERNAME,
        "password": PASSWORD
    }
    data = json.dumps(login_data).encode('utf-8')
    req = urllib.request.Request(
        LOGIN_URL,
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req) as res:
            if res.status == 200:
                response_body = json.loads(res.read().decode('utf-8'))
                # APIのレスポンスのキー名が 'token' であるため、'access_token' から変更
                token = response_body.get('token')
                if token:
                    print("[OK] ログイン成功")
                    return token
                else:
                    print("[Fail] ログインレスポンスにトークンがありません。")
                    return None
            else:
                print(f"[Fail] ログインに失敗しました - Status: {res.status}")
                return None
    except urllib.error.HTTPError as e:
        print(f"[Fail] ログインに失敗しました - HTTPError: {e.code} {e.reason}")
        print("  ※ ユーザー名またはパスワードが正しいか確認してください。")
        return None
    except Exception as e:
        print(f"[Fail] ログイン中に予期せぬエラーが発生しました: {e}")
        return None

def seed():
    # 1. ログインしてトークンを取得
    token = login()
    if not token:
        print("\nトークンが取得できなかったため、処理を中断します。")
        return

    print("\nお祭りデータの登録を開始します...")
    success_count = 0
    for festival in festivals_data:
        try:
            # JSONデータの作成
            data = json.dumps(festival).encode('utf-8')

            # リクエストの作成 (Authorizationヘッダーを追加)
            req = urllib.request.Request(
                API_URL,
                data=data,
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {token}' # トークンを設定
                },
                method='POST'
            )

            # リクエストの送信
            with urllib.request.urlopen(req) as res:
                if res.status in [200, 201]:
                    print(f"[OK] {festival['name']}")
                    success_count += 1
                else:
                    print(f"[Error] {festival['name']} - Status: {res.status}")

        except urllib.error.HTTPError as e:
            print(f"[Fail] {festival['name']} - HTTPError: {e.code} {e.reason}")
            if e.code in [401, 403]:
                print("  ※ ログインまたは権限に問題がある可能性があります。")
        except urllib.error.URLError as e:
            print(f"[Fail] {festival['name']} - URLError: {e.reason}")
            print("  ※ バックエンドサーバーが起動しているか確認してください。")
            break
        except Exception as e:
            print(f"[Fail] {festival['name']} - Error: {e}")

    print(f"\n完了: {success_count}/{len(festivals_data)} 件登録しました。")

if __name__ == "__main__":
    seed()
