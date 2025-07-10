# serializers.py
from rest_framework import serializers
from .models import Expenses, Types

class ExpenseOverviewSerializer(serializers.ModelSerializer):
    date = serializers.DateField(source='date_exp')
    typeName = serializers.CharField(source='type_id.type_name')
    cost = serializers.IntegerField()
    descript = serializers.CharField(source='comment')
    
    class Meta:
        model = Expenses
        fields = ['date', 'typeName', 'cost', 'descript']

class ExpenseSummarySerializer(serializers.Serializer):
    month = serializers.CharField()
    typeName = serializers.CharField()
    sumCost = serializers.IntegerField()
    limitMonth = serializers.IntegerField(allow_null=True)

# Fő serializer az üzleti logikához
class ExpenseCreateSerializer(serializers.ModelSerializer):
    datum = serializers.DateField(source='date_exp')
    typeId = serializers.IntegerField(source='type_id.id', write_only=True)
    osszeg = serializers.IntegerField(source='cost')
    leiras = serializers.CharField(source='comment', required=False, allow_blank=True)
    
    # Response fields
    id = serializers.IntegerField(read_only=True)
    date = serializers.DateField(source='date_exp', read_only=True)
    typeName = serializers.CharField(source='type_id.type_name', read_only=True)
    description = serializers.CharField(source='comment', read_only=True)
    
    class Meta:
        model = Expenses
        fields = ['datum', 'typeId', 'osszeg', 'leiras', 'id', 'date', 'typeName', 'cost', 'description']
        
    def create(self, validated_data):
        from django.db import connection
        
        type_id = validated_data.pop('type_id')['id']
        try:
            type_obj = Types.objects.get(id=type_id)
            
            # SQL Server sequencia használata az ID generáláshoz
            with connection.cursor() as cursor:
                # OUTPUT clause használata az ID visszaadásához
                cursor.execute("""
                    INSERT INTO EXPENSES (ID, DATE_EXP, TYPE_ID, COST, COMMENT) 
                    OUTPUT INSERTED.ID
                    VALUES (NEXT VALUE FOR SEQ_EXPENSES, %s, %s, %s, %s)
                """, [
                    validated_data['date_exp'],
                    type_obj.id,
                    validated_data['cost'],
                    validated_data.get('comment', '')
                ])
                
                # Az beszúrt ID lekérdezése
                result = cursor.fetchone()
                expense_id = result[0] if result else None
                
                if not expense_id:
                    raise Exception("Failed to get inserted ID")
            
            # Django objektum visszaadása a beszúrt adatokkal
            expense = Expenses(
                id=expense_id,
                date_exp=validated_data['date_exp'],
                type_id=type_obj,
                cost=validated_data['cost'],
                comment=validated_data.get('comment', '')
            )
            
            return expense
            
        except Types.DoesNotExist:
            raise serializers.ValidationError({"typeId": "Invalid type id"})

# Swagger dokumentációhoz külön serializer osztályok
class ExpenseCreateRequestSerializer(serializers.Serializer):
    datum = serializers.DateField(help_text="Költés dátuma (YYYY-MM-DD formátumban)")
    typeId = serializers.IntegerField(help_text="Költési típus egyedi azonosítója")
    osszeg = serializers.IntegerField(help_text="Költés összege (pozitív egész szám)")
    leiras = serializers.CharField(max_length=50, required=False, allow_blank=True, help_text="Költés leírása (maximum 50 karakter)")

class ExpenseCreateResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField(help_text="Sequencia által generált egyedi azonosító")
    date = serializers.DateField(help_text="Költés dátuma")
    typeName = serializers.CharField(help_text="Költési típus neve")
    cost = serializers.IntegerField(help_text="Költés összege")
    description = serializers.CharField(help_text="Költés leírása", allow_null=True)

class TypesListSerializer(serializers.ModelSerializer):
    typeId = serializers.IntegerField(source='id')
    typeName = serializers.CharField(source='type_name')
    limitMonth = serializers.IntegerField(source='limit_month')
    
    class Meta:
        model = Types
        fields = ['typeId', 'typeName', 'limitMonth']

class TypesUpdateSerializer(serializers.ModelSerializer):
    typeName = serializers.CharField(source='type_name', read_only=True)
    limitMonth = serializers.IntegerField(source='limit_month')
    
    class Meta:
        model = Types
        fields = ['typeName', 'limitMonth']