# expenses/views.py frissített verzió Swagger dokumentációval és új végpontokkal
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
    TypeCreateSerializer,
    TypeUpdateSerializer,
    ExpenseUpdateSerializer,
    TypeNameAlreadyExistsError
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
@api_view(['GET', 'POST'])
def expense_overview(request):
    """
    GET /expenses - A korábbi költéseket tételenként visszaadó API.
    POST /expenses - Új kiadást rögzítő API.
    """
    if request.method == 'GET':
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
            logger.error(f"Error in expense_overview GET: {str(e)}")
            return Response(
                {"error": "Internal server error"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    elif request.method == 'POST':
        try:
            serializer = ExpenseCreateSerializer(data=request.data)
            
            if serializer.is_valid():
                expense = serializer.save()  # A serializer create() metódusa kezeli
                
                # Response formázás
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
            logger.error(f"Error in expense_overview POST: {str(e)}")
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
    GET /expenses/sum
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
    GET /expenses/limit
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


# ÚJ: Típus létrehozása
@swagger_auto_schema(
    method='post',
    operation_description="Új típust létrehozó API. Az ID a SEQ_TYPE sequenciából automatikusan generálódik.",
    request_body=TypeCreateSerializer,
    responses={
        201: openapi.Response(
            description="Sikeres létrehozás",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'typeId': openapi.Schema(type=openapi.TYPE_INTEGER, description='Generált típus ID'),
                    'typeName': openapi.Schema(type=openapi.TYPE_STRING, description='Típus neve'),
                    'limitMonth': openapi.Schema(type=openapi.TYPE_INTEGER, description='Havi limit'),
                }
            )
        ),
        400: 'Bad Request - hibás adatok',
        409: 'Conflict - típus név már létezik',
        500: 'Internal server error'
    },
    tags=['Types']
)
@swagger_auto_schema(
    method='put',
    operation_description="Típus módosítása API. Típus nevét és/vagy limitjét módosítja. Típus név egyediségét ellenőrzi.",
    request_body=TypeUpdateSerializer,
    responses={
        200: openapi.Response(
            description="Sikeres módosítás",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'typeId': openapi.Schema(type=openapi.TYPE_INTEGER, description='Típus ID'),
                    'typeName': openapi.Schema(type=openapi.TYPE_STRING, description='Módosított típus neve'),
                    'limitMonth': openapi.Schema(type=openapi.TYPE_INTEGER, description='Módosított havi limit'),
                }
            )
        ),
        400: 'Bad Request - hibás adatok',
        404: 'Not Found - típus nem található',
        409: 'Conflict - típus név már létezik',
        500: 'Internal server error'
    },
    tags=['Types']
)
# EGYSÉGES: Type létrehozása és módosítása
@api_view(['POST', 'PUT'])
def manage_type(request, type_id=None):
    """
    POST /expensetype - Új típust létrehozó API
    PUT /expensetype/<type_id> - Típus módosítása API
    """
    if request.method == 'POST':
        try:
            serializer = TypeCreateSerializer(data=request.data)
            
            if serializer.is_valid():
                result = serializer.save()  # Dictionary-t ad vissza
                return Response(result, status=status.HTTP_201_CREATED)
            else:
                # Check if the error is specifically about type name uniqueness
                if 'typeName' in serializer.errors:
                    for error in serializer.errors['typeName']:
                        if isinstance(error, TypeNameAlreadyExistsError) or "már létezik" in str(error):
                            return Response(
                                {"error": "A típus név már létezik"}, 
                                status=status.HTTP_409_CONFLICT
                            )
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except TypeNameAlreadyExistsError as e:
            return Response(
                {"error": "A típus név már létezik"}, 
                status=status.HTTP_409_CONFLICT
            )
        except Exception as e:
            logger.error(f"Error in create_type: {str(e)}")
            return Response(
                {"error": "Internal server error"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    elif request.method == 'PUT':
        try:
            if not type_id:
                return Response(
                    {"error": "Type ID is required for PUT method"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if type exists
            try:
                Types.objects.get(id=type_id)
            except Types.DoesNotExist:
                return Response(
                    {"error": "Típus nem található"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            serializer = TypeUpdateSerializer(data=request.data, instance_id=type_id)
            
            if serializer.is_valid():
                result = serializer.update(type_id, serializer.validated_data)
                return Response(result, status=status.HTTP_200_OK)
            else:
                # Check if the error is specifically about type name uniqueness
                if 'typeName' in serializer.errors:
                    for error in serializer.errors['typeName']:
                        if isinstance(error, TypeNameAlreadyExistsError) or "már létezik" in str(error):
                            return Response(
                                {"error": "A típus név már létezik"}, 
                                status=status.HTTP_409_CONFLICT
                            )
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except TypeNameAlreadyExistsError as e:
            return Response(
                {"error": "A típus név már létezik"}, 
                status=status.HTTP_409_CONFLICT
            )
        except Exception as e:
            logger.error(f"Error in update_type: {str(e)}")
            return Response(
                {"error": "Internal server error"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ÚJ: Költés módosítása
@swagger_auto_schema(
    method='put',
    operation_description="Költés módosítását lehetővé tevő API.",
    request_body=ExpenseUpdateSerializer,
    responses={
        200: openapi.Response(
            description="Sikeres módosítás",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'expensesId': openapi.Schema(type=openapi.TYPE_INTEGER, description='Költés ID'),
                    'date': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATE, description='Költés dátuma'),
                    'typeName': openapi.Schema(type=openapi.TYPE_STRING, description='Típus neve'),
                    'cost': openapi.Schema(type=openapi.TYPE_INTEGER, description='Költés összege'),
                    'description': openapi.Schema(type=openapi.TYPE_STRING, description='Leírás'),
                }
            )
        ),
        400: 'Bad Request - hibás adatok',
        404: 'Not Found - nem létező költés',
        500: 'Internal server error'
    },
    tags=['Expenses']
)
@api_view(['PUT'])
def update_expense(request, expenses_id):
    """
    PUT /expenses/{expenses_id}
    Költés módosítását lehetővé tevő API.
    """
    try:
        # Ellenőrizzük, hogy létezik-e a költés
        try:
            expense = Expenses.objects.get(id=expenses_id)
        except Expenses.DoesNotExist:
            return Response(
                {"error": "Expense not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ExpenseUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            # Type objektum lekérése
            type_obj = Types.objects.get(id=serializer.validated_data['typeId'])
            
            # Raw SQL update a managed = False miatt
            with connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE EXPENSES 
                    SET DATE_EXP = %s, TYPE_ID = %s, COST = %s, COMMENT = %s
                    WHERE ID = %s
                """, [
                    serializer.validated_data['date'],
                    serializer.validated_data['typeId'],
                    serializer.validated_data['cost'],
                    serializer.validated_data.get('description', ''),
                    expenses_id
                ])
            
            response_data = {
                'expensesId': expenses_id,
                'date': serializer.validated_data['date'],
                'typeName': type_obj.type_name,
                'cost': serializer.validated_data['cost'],
                'description': serializer.validated_data.get('description', '')
            }
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except Types.DoesNotExist:
        return Response(
            {"error": "Type not found with given typeId"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error in update_expense: {str(e)}")
        return Response(
            {"error": "Internal server error"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )