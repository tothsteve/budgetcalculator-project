# expenses/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('expenses', views.expense_overview, name='expense_overview'),
    path('expenses/sum', views.expense_summary, name='expense_summary'),
    path('expenses/limit', views.types_list, name='types_list'),
    path('expensetype', views.manage_type, name='manage_type'),
    path('expensetype/<int:type_id>', views.manage_type, name='manage_type_with_id'),
    path('expenses/<int:expenses_id>', views.update_expense, name='update_expense'),
]