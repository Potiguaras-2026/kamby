from django.contrib import admin
from django.urls import path

from config.api import api

admin.site.site_header = "Kamby"
admin.site.site_title = "Kamby"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", api.urls),
]
