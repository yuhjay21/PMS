# e.g. config/api/v1/urls.py or wherever you collect api routes

from django.urls import path, include
from apps.accounts.api.views.auth import RegisterAPI, LoginAPI, LogoutAPI, CurrentUserAPI

urlpatterns = [
    # ... existing api endpoints ...
    path("register/", RegisterAPI.as_view(), name="api_register"),
    path("me/", CurrentUserAPI.as_view(), name="api_me"),
    path("login/", LoginAPI.as_view(), name="api_login"),
    path("logout/", LogoutAPI.as_view(), name="api_logout"),
]
