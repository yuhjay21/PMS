"""
URL configuration for portfolio_management_system project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from apps.accounts.api.views.auth import csrf
from drf_spectacular.views import SpectacularAPIView,SpectacularSwaggerView,SpectacularRedocView


urlpatterns = [
    # Admin Panel
    path("admin/", admin.site.urls),

    # Authentication (allauth or later DRF JWT)
    path("auth/", include("allauth.urls")),

    ## Authentication (allauth or later DRF JWT)
    path('accounts/', include('apps.accounts.api_urls')),

    # API v1 routes
    path("api/v1/", include("config.api.v1.urls")),

    # Health check endpoint
    #path("health/", include("django_healthchecks.urls")),

    # OpenAPI schema (machine readable)
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),

     # Swagger UI
    path("api/docs/swagger/",SpectacularSwaggerView.as_view(url_name="schema"),name="swagger-ui",),

    # ReDoc
    path("api/docs/redoc/",SpectacularRedocView.as_view(url_name="schema"),name="redoc",),

    path("csrf/", csrf),
]
