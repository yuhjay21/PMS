import imaplib
import email
import re
from datetime import datetime

from apps.dashboard.models import Portfolio, transaction
from . import stake_regex


def fetch_stake_trades_for_user(user, selected_portfolio_id, gmail_secrets):
    """
    Reuses your IMAP + regex logic to return parsed Stake trades as a list of dicts.
    gmail_secrets: queryset of AppSecret with Gmail creds.
    """
    mail_list = []

    for cred in gmail_secrets:
        username = cred.key
        password = cred.value
        folder = cred.description or "INBOX"

        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(username, password)
        mail.select(folder)

        status, data = mail.search(
            None, '(FROM "notifications@hellostake.com" SUBJECT "Trade Confirmation")'
        )
        mail_ids = data[0].split()
        if not mail_ids:
            mail.logout()
            continue

        latest_ids = b",".join(mail_ids)
        status, fetched_data = mail.fetch(latest_ids, "(RFC822)")
        mail_list += fetched_data
        mail.logout()

    parsed_trades = []

    for i in range(0, len(mail_list), 2):
        try:
            raw_msg = mail_list[i][1]
            msg = email.message_from_bytes(raw_msg)

            body = None
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain" and not part.get(
                        "Content-Disposition"
                    ):
                        body_bytes = part.get_payload(decode=True)
                        if body_bytes:
                            body = body_bytes.decode("utf-8", errors="ignore")
                            break
            else:
                body_bytes = msg.get_payload(decode=True)
                if body_bytes:
                    body = body_bytes.decode("utf-8", errors="ignore")

            if not body:
                continue

            m = {k: r.search(body) for k, r in stake_regex.REGEX.items()}
            if not all(m.values()):
                continue

            trade_type = (
                "Buy"
                if "buy order" in body.lower()
                else "Sell"
                if "sell order" in body.lower()
                else "UNKNOWN"
            )

            symbol = m["symbol"].group(1)
            price = float(m["price"].group(1).replace(",", ""))
            quantity = int(m["qty"].group(1).replace(",", ""))
            commission = float(m["commission"].group(1).replace(",", ""))
            date_str = m["date"].group(1).strip()

            trade_date = None
            for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d %b %Y"):
                try:
                    trade_date = datetime.strptime(date_str, fmt)
                    break
                except ValueError:
                    continue

            if not trade_date:
                continue

            # Avoid duplicates across all user's portfolios
            user_portfolios = Portfolio.objects.filter(user=user)
            if selected_portfolio_id != "all":
                user_portfolios = user_portfolios.filter(id=selected_portfolio_id)

            if transaction.objects.filter(
                Holding__portfolio__in=user_portfolios,
                symbol=symbol + ".AX",
                date_transaction=trade_date.date(),
                transaction_type=trade_type,
                Buy_Price=price,
                Quantity=quantity,
            ).exists():
                continue

            parsed_trades.append(
                {
                    "symbol": symbol,
                    "price": price,
                    "quantity": quantity,
                    "commission": commission,
                    "trade_type": trade_type,
                    "trade_date": trade_date.strftime("%Y-%m-%d"),
                }
            )
        except Exception:
            continue

    return parsed_trades
