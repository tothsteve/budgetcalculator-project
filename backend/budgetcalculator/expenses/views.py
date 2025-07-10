# expenses/views.py frissített verzió Swagger dokumentációval
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import connection
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .models import Expenses, Types
from .serializers import (
    ExpenseOverviewSerializer, 
    ExpenseSummarySerializer,
    ExpenseCreateSerializer,
    ExpenseCreateRequestSerializer,
    ExpenseCreateResponseSerializer,
    TypesListSerializer,
    TypesUpdateSerializer
)
import logging

logger = logging.getLogger(__name__)

# Swagger parameters
expense_id_param = openapi.Parameter(
    'expensesId', 
    openapi.IN_QUERY, 
    description="Költés egyedi azonosítója", 
    type=openapi.TYPE_INTEGER,
    required=False
)

limit_month_param = openapi.Parameter(
    'limitMonth', 
    openapi.IN_QUERY, 
    description="Havi limit összege", 
    type=openapi.TYPE_INTEGER,
    required=True
)

@swagger_auto_schema(
    method='get',
    operation_description="A korábbi költéseket tételenként visszaadó API. Ha expensesId megadva, egy konkrét költést ad vissza.",
    manual_parameters=[expense_id_param],
    responses={
        200: ExpenseOverviewSerializer(many=True),
        404: 'Expense not found',
        500: 'Internal server error'
    },
    tags=['Expenses']
)
@api_view(['GET'])
def expense_overview(request):
    """
    GET /koltesek/attekinto
    A korábbi költéseket tételenként visszaadó API.
    """
    try:
        expense_id = request.query_params.get('expensesId')
        
        if expense_id:
            try:
                expense = Expenses.objects.select_related('type_id').get(id=expense_id)
                serializer = ExpenseOverviewSerializer(expense)
                return Response([serializer.data], status=status.HTTP_200_OK)
            except Expenses.DoesNotExist:
                return Response(
                    {"error": "Expense not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            expenses = Expenses.objects.select_related('type_id').order_by('-date_exp')
            serializer = ExpenseOverviewSerializer(expenses, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
    except Exception as e:
        logger.error(f"Error in expense_overview: {str(e)}")
        return Response(
            {"error": "Internal server error"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@swagger_auto_schema(
    method='get',
    operation_description="A korábbi kiadásokat havonként és típusonként összegzi. Havi limitekkel összehasonlítva.",
    responses={
        200: ExpenseSummarySerializer(many=True),
        500: 'Internal server error'
    },
    tags=['Expenses']
)
@api_view(['GET'])
def expense_summary(request):
    """
    GET /koltesek/osszegzo
    A korábbi kiadásokat havonként és típusonként visszaadó API
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    CONVERT(CHAR(7), e.DATE_EXP, 120) as honap, 
                    t.TYPE_NAME, 
                    sum(e.COST) as osszkoltes, 
                    t.LIMIT_MONTH 
                FROM
                    EXPENSES e 
                    JOIN TYPES t on e.TYPE_ID = t.ID
                GROUP BY
                    CONVERT(CHAR(7), e.DATE_EXP, 120), 
                    t.TYPE_NAME , 
                    t.LIMIT_MONTH
                ORDER BY
                    honap DESC, 
                    osszkoltes DESC
            """)
            
            results = cursor.fetchall()
            
        summary_data = []
        for row in results:
            summary_data.append({
                'month': row[0],
                'typeName': row[1],
                'sumCost': row[2],
                'limitMonth': row[3]
            })
            
        serializer = ExpenseSummarySerializer(summary_data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in expense_summary: {str(e)}")
        return Response(
            {"error": "Internal server error"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@swagger_auto_schema(
    method='post',
    operation_description="Új kiadást rögzítő API. Validálja a dátumot (nem jövőbeli), összeget (pozitív), típust és leírást.",
    request_body=ExpenseCreateSerializer,
    responses={
        200: openapi.Response(
            description="Sikeres mentés",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'id': openapi.Schema(type=openapi.TYPE_INTEGER, description='Generált ID'),
                    'date': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATE, description='Költés dátuma'),
                    'typeName': openapi.Schema(type=openapi.TYPE_STRING, description='Típus neve'),
                    'cost': openapi.Schema(type=openapi.TYPE_INTEGER, description='Költés összege'),
                    'description': openapi.Schema(type=openapi.TYPE_STRING, description='Leírás'),
                }
            )
        ),
        400: 'Bad Request - hibás adatok',
        500: 'Internal server error'
    },
    tags=['Expenses']
)
@api_view(['POST'])
def create_expense(request):
    """
    POST /koltesek
    Új kiadást rögzítő API.
    """
    try:
        serializer = ExpenseCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            expense = serializer.save()
            response_data = {
                'id': expense.id,
                'date': expense.date_exp,
                'typeName': expense.type_id.type_name,
                'cost': expense.cost,
                'description': expense.comment
            }
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error in create_expense: {str(e)}")
        return Response(
            {"error": "Internal server error"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@swagger_auto_schema(
    method='get',
    operation_description="A típusokat és a hozzájuk tartozó limiteket visszaadó API. Limit szerint csökkenő sorrendben.",
    responses={
        200: TypesListSerializer(many=True),
        500: 'Internal server error'
    },
    tags=['Types']
)
@api_view(['GET'])
def types_list(request):
    """
    GET /koltesek/limit_kiir
    A típusokat és a hozzájuk tartozó limiteket visszaadó API.
    """
    try:
        types = Types.objects.all().order_by('-limit_month')
        serializer = TypesListSerializer(types, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in types_list: {str(e)}")
        return Response(
            {"error": "Internal server error"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@swagger_auto_schema(
    method='put',
    operation_description="A limitek módosítását lehetővé tevő API. A limit nem lehet negatív érték.",
    manual_parameters=[limit_month_param],
    responses={
        200: TypesUpdateSerializer,
        400: 'Bad Request - hiányzó vagy hibás paraméter',
        404: 'Type not found',
        500: 'Internal server error'
    },
    tags=['Types']
)
@api_view(['PUT'])
def update_limit(request, type_id):
    """
    PUT /koltesek/limitmod/<type_id>
    A limitek módosítását lehetővé tevő API.
    """
    try:
        limit_month = request.query_params.get('limitMonth')
        
        if not limit_month:
            return Response(
                {"error": "limitMonth parameter required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            limit_month = int(limit_month)
        except ValueError:
            return Response(
                {"error": "limitMonth must be an integer"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            type_obj = Types.objects.get(id=type_id)
            type_obj.limit_month = limit_month
            type_obj.save()
            
            serializer = TypesUpdateSerializer(type_obj)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Types.DoesNotExist:
            return Response(
                {"error": "Type not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
    except Exception as e:
        logger.error(f"Error in update_limit: {str(e)}")
        return Response(
            {"error": "Internal server error"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )