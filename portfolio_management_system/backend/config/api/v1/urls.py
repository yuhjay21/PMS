from django.urls import path, include

urlpatterns = [
    path("dashboard/", include("apps.dashboard.api_urls")),
    #path('accounts/', include('apps.accounts.api_urls')),
    path("risk/", include("apps.riskprofile.api_urls")),
    path("user/", include("apps.home.api_urls")),
]
