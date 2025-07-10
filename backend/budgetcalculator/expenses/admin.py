from django.contrib import admin
from .models import Types, Expenses

@admin.register(Types)
class TypesAdmin(admin.ModelAdmin):
    list_display = ['id', 'type_name', 'limit_month']
    list_editable = ['type_name', 'limit_month']
    search_fields = ['type_name']

@admin.register(Expenses)
class ExpensesAdmin(admin.ModelAdmin):
    list_display = ['id', 'date_exp', 'type_id', 'cost', 'comment']
    list_filter = ['type_id', 'date_exp']
    search_fields = ['comment']
    date_hierarchy = 'date_exp'
    ordering = ['-date_exp']