# models.py
from django.db import models

class Types(models.Model):
    # SQL Server sequencia-val kompatibilis ID mező
    id = models.IntegerField(primary_key=True)
    type_name = models.CharField(max_length=50, null=True, blank=True)
    limit_month = models.IntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 'TYPES'
        managed = False  # Django ne kezelje a táblát, mert már létezik
        
    def __str__(self):
        return self.type_name or f"Type {self.id}"

class Expenses(models.Model):
    # SQL Server sequencia-val kompatibilis ID mező
    id = models.IntegerField(primary_key=True)
    date_exp = models.DateField(null=True, blank=True)
    type_id = models.ForeignKey(Types, on_delete=models.CASCADE, db_column='TYPE_ID')
    cost = models.IntegerField(null=True, blank=True)
    comment = models.CharField(max_length=50, null=True, blank=True)
    
    class Meta:
        db_table = 'EXPENSES'
        managed = False  # Django ne kezelje a táblát, mert már létezik
        ordering = ['-date_exp']
        
    def __str__(self):
        return f"{self.cost} - {self.type_id.type_name} - {self.date_exp}"