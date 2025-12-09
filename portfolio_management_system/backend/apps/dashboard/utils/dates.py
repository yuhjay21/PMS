# dashboard/utils/dates.py

from datetime import date, timedelta


def weekday_dates():
    today = date.today()
    
    # If today is Saturday (5), go back to Friday (4)
    if today.weekday() < 5:
        today = today + timedelta(days=1)
    # If today is Sunday (6), go back to Friday (4)
    elif today.weekday() == 6:
        today = today - timedelta(days=1)
    
    # Yesterday (ensuring it's also a weekday)
    yesterday = today - timedelta(days=2)
    if yesterday.weekday() == 5:  # Saturday
        yesterday = yesterday - timedelta(days=1)
    elif yesterday.weekday() == 6:  # Sunday
        yesterday = yesterday - timedelta(days=2)
    
    return today, yesterday
