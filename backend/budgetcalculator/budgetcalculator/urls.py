from django.contrib import admin
from django.urls import path, include, re_path
from django.shortcuts import redirect
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

def home_redirect(request):
    """Redirect root URL to Swagger documentation"""
    return redirect('/swagger/')

schema_view = get_schema_view(
   openapi.Info(
      title="Budget Calculator API",
      default_version='v1',
      description="Budget Calculator költségkezelő alkalmazás REST API dokumentációja",
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="contact@budgetcalculator.local"),
      license=openapi.License(name="MIT License"),
   ),
   public=True,
   permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('', home_redirect, name='home'),  # Root URL redirect
    path('admin/', admin.site.urls),
    path('', include('expenses.urls')),
    
    # Swagger dokumentáció
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    re_path(r'^swagger/$', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    re_path(r'^redoc/$', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
