from rest_framework.views import APIView
from datetime import date
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.shortcuts import get_object_or_404
from .models import CustomUser, Employees, Leave, PunchTime
from .serializers import CustomUserSerializer, EmployeesSerializer, LeaveSerializer, PunchTimeSerializer
from django.utils import timezone

class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)

class CustomUserListCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = CustomUser.objects.select_related('employee_details').all()
        serializer = CustomUserSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CustomUserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomUserDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(CustomUser.objects.select_related('employee_details'), pk=pk)

    def get(self, request, pk):
        user = self.get_object(pk)
        if not request.user.is_superuser and request.user != user:
            return Response({"detail": "You can only view your own profile."}, status=status.HTTP_403_FORBIDDEN)
        serializer = CustomUserSerializer(user)
        return Response(serializer.data)
    
    def put(self, request, pk):
        user = self.get_object(pk)
        if not request.user.is_superuser:
            return Response({"detail": "Only admin can edit user data."}, status=status.HTTP_403_FORBIDDEN)

        if 'password' in request.data:
            request.data.pop('password')

        serializer = CustomUserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        user = self.get_object(pk)
        if not request.user.is_superuser:
            return Response({"detail": "Only admin can delete users."}, status=status.HTTP_403_FORBIDDEN)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class EmployeesListCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_superuser:
            employees = Employees.objects.filter(user=request.user)
        else:
            employees = Employees.objects.all()
        serializer = EmployeesSerializer(employees, many=True)
        return Response(serializer.data)

class LeaveListCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.is_superuser:
            leaves = Leave.objects.all()
        else:
            leaves = Leave.objects.filter(employee__user=request.user)
        serializer = LeaveSerializer(leaves, many=True)
        return Response(serializer.data)

    def post(self, request):
        leave_data = {
            "user_id": request.user.id,  # Ensure user ID is passed
            "leave_type": request.data.get("leave_type"),
            "start_date": request.data.get("start_date"),
            "end_date": request.data.get("end_date"),
            "reason": request.data.get("reason"),
            # "first_name": request.data.get("first_name")
        }

        serializer = LeaveSerializer(data=leave_data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LeaveUpdateStatusView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]
    def patch(self, request, pk):
        leave = get_object_or_404(Leave, pk=pk)
        serializer = LeaveSerializer(leave, data={'status': request.data.get('status')}, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PunchTimeListCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if request.user.is_superuser:
            punch_times = PunchTime.objects.select_related('employee__user').all()
        else:
            employee = get_object_or_404(Employees, user=request.user)
            punch_times = PunchTime.objects.filter(employee=employee)
        response_data = [
            {
                "id": punch.id,
                "employee": {
                    "first_name": punch.employee.user.first_name, 
                },
                "punch_in_time": timezone.localtime(punch.punch_in_time).strftime("%H:%M:%S"),
                "punch_out_time": timezone.localtime(punch.punch_out_time).strftime("%H:%M:%S"),
                "date": punch.date,  
            }
            for punch in punch_times
        ]
        return Response(response_data)
    
    def post(self, request):
        employee = get_object_or_404(Employees, user=request.user)
        if PunchTime.objects.filter(employee=employee, punch_out_time__isnull=True).exists():
            return Response(
                {"error": "You must punch out before punching in again."},
                status=status.HTTP_400_BAD_REQUEST
            )
        punch_data = {
            "user_id": request.user.id,  # Use user_id instead of employee_id
            "date": date.today(),
            "punch_in_time": request.data.get("punch_in_time")
        }
        serializer = PunchTimeSerializer(data=punch_data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PunchTimeDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    def patch(self, request, pk):
        punch_time = get_object_or_404(PunchTime, id=pk)
        if punch_time.punch_out_time:
            return Response({"error": "Already punched out"}, status=status.HTTP_400_BAD_REQUEST)
        punch_time.punch_out_time = timezone.localtime().time()
        punch_time.save()
        return Response({"message": "Punched out successfully"}, status=status.HTTP_200_OK)



# from rest_framework import viewsets,permissions
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from rest_framework.decorators import action
# from django.contrib.auth.hashers import make_password
# from rest_framework_simplejwt.authentication import JWTAuthentication
# from .models import CustomUser, Employees, Leave, PunchTime
# from .serializers import CustomUserSerializer, EmployeesSerializer, LeaveSerializer, PunchTimeSerializer

# class IsAdminUser(permissions.BasePermission):
#     def has_permission(self, request, view):
#         return request.user and request.user.is_authenticated and request.user.is_superuser

# class CustomUserViewSet(viewsets.ModelViewSet):
#     queryset = CustomUser.objects.all().select_related('employees')
#     serializer_class = CustomUserSerializer
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [permissions.IsAuthenticated,IsAdminUser],

#     def create(self, request, *args, **kwargs):
#         if not request.user.is_superuser:
#             return Response({"error": "Only superusers can create users."}, status=403)

#         data = request.data.copy()
#         employee_data = data.get('employee_details', {})

#         password = data.pop("password", None)

#         serializer = self.get_serializer(data=data)
#         serializer.is_valid(raise_exception=True)
#         user = serializer.save()

#         if password:
#             user.set_password(password)
#             user.save()

#         # Create employee record only if details exist
#         if employee_data:
#             Employees.objects.create(admin=user, **employee_data)

#         return Response(serializer.data, status=201)

#     def update(self, request, *args, **kwargs):
#         user = self.get_object()
#         data = request.data.copy()
#         employee_data = data.get('employee_details', {})

#         serializer = self.get_serializer(user, data=data, partial=True)
#         serializer.is_valid(raise_exception=True)
#         serializer.save()

#         if employee_data:
#             Employees.objects.update_or_create(admin=user, defaults=employee_data)

#         return Response(serializer.data)

#     def destroy(self, request, *args, **kwargs):
#         user = self.get_object()
#         user.delete()  # Cascade deletes employee
#         return Response({"message": "User and associated employee deleted"}, status=204)

#     @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
#     def me(self, request):
#         serializer = self.get_serializer(request.user)
#         return Response(serializer.data)

# class EmployeesViewSet(viewsets.ModelViewSet):
#     queryset = Employees.objects.all()
#     serializer_class = EmployeesSerializer
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticated]
    

# class LeaveViewSet(viewsets.ModelViewSet):
#     queryset = Leave.objects.all()
#     serializer_class = LeaveSerializer
#     permission_classes = [IsAuthenticated, IsAdminUser]

    
#     @action(detail=True, methods=['patch'])
#     def update_status(self, request, pk=None):
#         leave = self.get_object()
#         leave.status = request.data.get('status', leave.status)
#         leave.save()
#         return Response({"status": leave.status})

# class PunchTimeViewSet(viewsets.ModelViewSet):
#     queryset = PunchTime.objects.all()
#     serializer_class = PunchTimeSerializer

    
# from django.utils import timezone
# from rest_framework import viewsets, status
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.decorators import action
# from django.contrib.auth.hashers import make_password
# from rest_framework_simplejwt.authentication import JWTAuthentication
# from django.db.utils import IntegrityError
# from .models import CustomUser, Employees, Leave, PunchTime
# from .serializers import CustomUserSerializer, EmployeesSerializer, LeaveSerializer, PunchTimeSerializer

# class CustomUserViewSet(viewsets.ModelViewSet):
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticated]
#     queryset = CustomUser.objects.all()
#     serializer_class = CustomUserSerializer


#     def create(self, request, *args, **kwargs):
#         """Only Admins Can Create Users"""
#         if request.user.user_type != "admin":
#             return Response({"error": "Only admins can create users."}, status=status.HTTP_403_FORBIDDEN)

#         data = request.data
#         try:
#             if CustomUser.objects.filter(email=data['email']).exists():
#                 return Response({"error": "User with this email already exists"}, status=status.HTTP_400_BAD_REQUEST)
            
#             user = CustomUser.objects.create(
#                 username=data['email'],
#                 first_name=data['fullName'],
#                 email=data['email'],
#                 password=make_password(data['password']),
#                 user_type=data['user_type']
#             )
#             Employees.objects.create(
#                 admin=user,
#                 mobilenumber=data['mobileNumber'],
#                 empcode=data['empcode'],
#                 empdept=data['department'],
#                 empdesignation=data['designation'],
#                 address=data['address'],
#                 joiningdate=data['joiningDate']
#             )
#             return Response({"message": "User created successfully!"}, status=status.HTTP_201_CREATED)
#         except IntegrityError:
#             return Response({"error": "Database integrity error. Possibly duplicate entry."}, status=status.HTTP_400_BAD_REQUEST)
#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# class EmployeesViewSet(viewsets.ModelViewSet):
#     queryset = Employees.objects.all()
#     serializer_class = EmployeesSerializer
#     permission_classes = [IsAuthenticated]

#     @action(detail=False, methods=['GET'])
#     def my_profile(self, request):
#         """Retrieve the logged-in user's employee profile"""
#         employee = Employees.objects.filter(admin=request.user).first()
#         if employee:
#             serializer = self.get_serializer(employee)
#             return Response(serializer.data)
#         return Response({"error": "Employee profile not found"}, status=status.HTTP_404_NOT_FOUND)


# class LeaveViewSet(viewsets.ModelViewSet):
#     queryset = Leave.objects.all()
#     serializer_class = LeaveSerializer
#     permission_classes = [IsAuthenticated]

#     def perform_create(self, serializer):
#         """Assign the logged-in employee when creating a leave request"""
#         try:
#             employee = Employees.objects.get(admin=self.request.user)
#             serializer.save(employee=employee)
#         except Employees.DoesNotExist:
#             raise ValueError("Employee profile not found")

#     @action(detail=True, methods=['PATCH'])
#     def update_status(self, request, pk=None):
#         """Admin can approve or reject leave requests"""
#         if request.user.user_type != "admin":
#             return Response({"error": "Only admins can update leave status."}, status=status.HTTP_403_FORBIDDEN)

#         leave = self.get_object()
#         status_choice = request.data.get('status')

#         if status_choice in ['Approved', 'Rejected', 'Pending']:
#             leave.status = status_choice
#             leave.save()
#             return Response({"message": f"Leave {status_choice.lower()} successfully!"}, status=status.HTTP_200_OK)
#         return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)

# class PunchTimeViewSet(viewsets.ModelViewSet):
#     queryset = PunchTime.objects.all()
#     serializer_class = PunchTimeSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         """Admin sees all records; employees see only their own"""
#         if self.request.user.user_type == "admin":
#             return PunchTime.objects.all()  # Admin can see all punch records
#         return PunchTime.objects.filter(employee__admin=self.request.user)  # Employees see only their own records

#     @action(detail=False, methods=['POST'])
#     def punch_in(self, request):
#         """Employee can punch in"""
#         try:
#             employee = Employees.objects.get(admin=request.user)
#             punch_in_record = PunchTime.objects.create(
#                 employee=employee,
#                 punch_in_time=timezone.now(),
#                 date=timezone.now().date()
#             )
#             return Response({"message": "Punch-in recorded!", "punch_in_time": punch_in_record.punch_in_time}, status=status.HTTP_201_CREATED)
#         except Employees.DoesNotExist:
#             return Response({"error": "Employee profile not found"}, status=status.HTTP_400_BAD_REQUEST)

#     @action(detail=False, methods=['PATCH'])
#     def punch_out(self, request):
#         """Employee can punch out"""
#         try:
#             employee = Employees.objects.get(admin=request.user)
#             punch_record = PunchTime.objects.filter(employee=employee, date=timezone.now().date()).first()

#             if punch_record and not punch_record.punch_out_time:
#                 punch_record.punch_out_time = timezone.now()
#                 punch_record.save()
#                 return Response({"message": "Punch-out recorded!", "punch_out_time": punch_record.punch_out_time}, status=status.HTTP_200_OK)

#             return Response({"error": "No punch-in record found or already punched out"}, status=status.HTTP_400_BAD_REQUEST)
#         except Employees.DoesNotExist:
#             return Response({"error": "Employee profile not found"}, status=status.HTTP_400_BAD_REQUEST)


