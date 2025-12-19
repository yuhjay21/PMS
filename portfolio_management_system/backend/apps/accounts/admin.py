from django.contrib import admin, messages
from apps.dashboard.models import Portfolio, StockHolding, transaction, deposit, AppSecret, Ticker, TickerData


def reset_model_data(modeladmin, request, queryset):
    # This action ignores the selected queryset and deletes all objects
    TickerData.objects.all().delete()
    messages.success(request, "The database has been reset (all records deleted).")
reset_model_data.short_description = "Reset YourModel database (deletes all records)"

# Register your models here.
@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    list_display = ('user','name','plateform','total_investment','total_amount')
    list_filter = ('plateform',)
    search_fields = ("name",)


@admin.register(StockHolding)
class HoldingAdmin(admin.ModelAdmin):
    list_display = ('portfolio','Exchange','company_symbol','number_of_shares',"investment_amount",'total_cost','Realized_PnL','UnRealized_PnL')
    list_filter = ('portfolio','Exchange',)
    search_fields = ("company_symbol",)


@admin.register(transaction)
class transactionAdmin(admin.ModelAdmin):
    list_display = ('Holding__portfolio','symbol','transaction_type','Quantity','Buy_Price','date_transaction', 'Commission')
    list_filter = ('Holding__portfolio','transaction_type','symbol')
    search_fields = ("symbol",)

@admin.register(deposit)
class depositAdmin(admin.ModelAdmin):
    list_display = ('portfolio','currency','total_amount','date_transaction')
    list_filter = ('portfolio',)
    search_fields = ('portfolio',"currency",)

@admin.register(AppSecret)
class AppSecretAdmin(admin.ModelAdmin):
    list_display = ('portfolio',"type",'key','description', "is_active")
    list_filter = ('type','portfolio')
    search_fields = ("type",)

admin.site.register(Ticker)

@admin.register(TickerData)
class TickerDataAdmin(admin.ModelAdmin):
    list_display = ('date',"ticker",'close','open', "high", 'low')
    list_filter = ('ticker','date')
    search_fields = ("ticker",)
    actions = [reset_model_data]
