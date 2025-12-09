# e.g. config/api/v1/urls.py or wherever you collect api routes

from django.urls import path, include
from apps.accounts.api.views.auth import RegisterAPI

urlpatterns = [
    # ... existing api endpoints ...
    path("register/", RegisterAPI.as_view(), name="api_register"),
]
