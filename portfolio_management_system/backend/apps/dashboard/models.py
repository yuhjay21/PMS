from django.db import models
from django.contrib.auth.models import User
from django.db.models import JSONField
from datetime import date

class Portfolio(models.Model):
  user = models.ForeignKey(User, on_delete=models.CASCADE)
  name = models.CharField(default="", max_length=100)
  description = models.CharField(default="", max_length=250)
  total_investment = models.FloatField(default=0)
  total_amount = models.FloatField(default=0)
  currency = models.CharField(default='AUD', max_length=5)
  plateform = models.CharField(default='STAKE', max_length=10)

  def update_investment(self):
    investment = 0
    total_amount = 0
    holdings = StockHolding.objects.filter(portfolio=self)
    for c in holdings:
      investment += c.investment_amount
    self.total_investment = investment
    self.save()

  def __str__(self):
    return "Portfolio : " + str(self.name)

class AppSecret(models.Model):
    Key_types = {
      "Gmail":"Gmail",
      "API" : "API"
    }
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE)
    type = models.CharField(max_length=100, choices=Key_types)
    key = models.CharField(blank=True, null=True,max_length=100)
    value = models.CharField(blank=True, null=True,max_length=100)
    description = models.CharField(blank=True, null=True,max_length=250)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.type + " : " + str(self.key)

class StockHolding(models.Model):
  portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE)
  company_symbol = models.CharField(default='', max_length=25)
  company_name = models.CharField(max_length=100)
  sector = models.CharField(default='', max_length=50)
  Exchange = models.CharField(max_length=100, default='ASX')
  number_of_shares = models.IntegerField(default=0)
  investment_amount = models.FloatField(default=0)
  total_cost = models.FloatField(default=0)
  average_buy_price = models.FloatField(default=0)
  Realized_PnL = models.FloatField(default=0)
  UnRealized_PnL = models.FloatField(default=0)
  LTP = models.FloatField(default=0)

  def __str__(self):
    return str(self.portfolio.description) + " -> " + self.company_symbol + " " + str(self.number_of_shares)


class transaction(models.Model):
  # user = models.OneToOneField(User, on_delete=models.CASCADE)
  transaction_types = {
    'Buy':'Buy',
    'Sell':'Sell',
    'Dividend Reinvestment':'RDP',
    'Cash Deposit': 'CD',
    'Dividend Deposit' : "Dividend"
    }
  
  Holding = models.ForeignKey(StockHolding, on_delete=models.CASCADE)
  symbol = models.CharField(default='', max_length=25)
  date_transaction = models.DateField(default=date.today)
  Buy_Price = models.FloatField(default=0)
  Quantity = models.FloatField(default=0)
  Total = models.FloatField(default=0)
  transaction_type =  models.CharField(max_length=50, choices=transaction_types)
  Commission = models.FloatField(default=0)

  #def save(self, *args, **kwargs):


  def __str__(self):
    return "Transaction : " + self.symbol + " | " + self.transaction_type + " | "+ str(self.Quantity) +" | "+ str(self.Buy_Price) + " | " + str(self.date_transaction) 

class Ticker(models.Model):
    exchanges = {
      "ASX" : "ASX",
      "PSX" : "PSX"
    }
    symbol = models.CharField(max_length=10, unique=True, editable=False)
    #name = models.CharField(max_length=100, blank=True, null=True)  # optional
    ticker = models.CharField(max_length=10, default="")
    first_txn = models.DateField(null=True, blank=True)
    last_txn = models.DateField(null=True, blank=True)
    exchange = models.CharField(max_length=5, choices=exchanges, default="ASX")

    def save(self,*args,**kwargs):
      if self.ticker:
         if self.exchange == "ASX":
            self.symbol = self.ticker+'.AX'
      super().save(*args,**kwargs)

    def __str__(self):
      return self.symbol

class MarketRefreshState(models.Model):
    last_refresh = models.DateTimeField(null=True, blank=True)
    refresh_lock_reason = models.CharField(max_length=50, null=True, blank=True)
    refresh_lock_acquired_at = models.DateTimeField(null=True, blank=True)
    refresh_lock_expires_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return "Market refresh state"

class TickerData(models.Model):
  
  ticker  = models.ForeignKey(Ticker, on_delete=models.CASCADE, related_name='historical_data')
  date = models.DateField(default=date.today)
  datetime = models.DateTimeField(null=True, blank=True)
  close = models.FloatField(null=True, blank=True)
  open = models.FloatField(null=True, blank=True)
  high = models.FloatField(null=True, blank=True)
  low = models.FloatField(null=True, blank=True)
  volume = models.FloatField(null=True, blank=True)

  class Meta:
      unique_together = ('ticker', 'date')  # prevent duplicate entries
      ordering = ['date']
  def __str__(self):
        return f"{self.ticker.symbol} - {self.date}"

class deposit(models.Model):
  # user = models.OneToOneField(User, on_delete=models.CASCADE)


  portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE)
  currency = models.CharField(default='', max_length=5)
  plateform = models.CharField(default='STAKE', max_length=10)
  total_amount = models.FloatField(default=0)
  date_transaction = models.DateField(default=date.today)
  #def save(self, *args, **kwargs):


  def __str__(self):
    return "Cash : {:.2f} | {}".format(self.total_amount, self.currency)
  


  