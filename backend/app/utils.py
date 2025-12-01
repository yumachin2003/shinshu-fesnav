from datetime import date
from dateutil.relativedelta import relativedelta, MO, TU, WE, TH, FR, SA, SU

def calculate_concrete_date(year, rule_string):
    """
    '8月第1土曜日' のようなルール文字列から具体的な日付を計算する。
    :param year: 計算対象の年 (e.g., 2024)
    :param rule_string: '8月第1土曜日' のようなルール文字列
    :return: 'YYYY-MM-DD' 形式の日付文字列、または計算不可の場合は None
    """
    if not rule_string:
        return None
    try:
        # 例: "8月第1土曜日" をパース
        month_str, rest = rule_string.split('月')
        week_str, day_str = rest.split('第')[1].split('曜日')
        
        month = int(month_str)
        week = int(week_str)
        
        day_map = {'月': MO, '火': TU, '水': WE, '木': TH, '金': FR, '土': SA, '日': SU}
        day_of_week = day_map.get(day_str[0])

        if day_of_week is None: return None

        first_day_of_month = date(year, month, 1)
        target_date = first_day_of_month + relativedelta(weekday=day_of_week(week))
        return target_date.strftime('%Y-%m-%d')
    except (ValueError, KeyError, IndexError):
        return None