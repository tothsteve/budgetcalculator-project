# expenses/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('koltesek/attekinto', views.expense_overview, name='expense_overview'),
    path('koltesek/osszegzo', views.expense_summary, name='expense_summary'),
    path('koltesek', views.create_expense, name='create_expense'),
    path('koltesek/limit_kiir', views.types_list, name='types_list'),
    path('koltesek/limitmod/<int:type_id>', views.update_limit, name='update_limit'),
    path('expensetype', views.create_type, name='create_type'),
    path('expenses/<int:expenses_id>', views.update_expense, name='update_expense'),
]