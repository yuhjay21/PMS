import re

REGEX = {
    "symbol": re.compile(r"Your [:\s]*([A-Z]+)\.ASX order"),
    "price": re.compile(r"Effective\s*price[\s\S\n\r]*?A?\$?\s*([\d,]+\.\d+)"),
    "qty": re.compile(r"Shares[\s\S\n\r]*?(\d+)"),
    "date": re.compile(r"filled on\s+(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})"),
    "commission": re.compile(r"Brokerage[\s\S\n\r]*?A?\$?\s*([\d,]+\.\d+)"),
}
