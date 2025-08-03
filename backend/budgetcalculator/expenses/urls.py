# expenses/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('expenses', views.expense_overview, name='expense_overview'),
    path('expenses/sum', views.expense_summary, name='expense_summary'),
    path('expenses/limit', views.types_list, name='types_list'),
    path('expenses/limit/<int:type_id>', views.update_limit, name='update_limit'),
    path('expensetype', views.create_type, name='create_type'),
    path('expenses/<int:expenses_id>', views.update_expense, name='update_expense'),
]