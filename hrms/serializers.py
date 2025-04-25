from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import CustomUser, Employees, Leave, PunchTime

class EmployeesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employees
        fields = '__all__'
        extra_kwargs = {
            'user': {'required': False, 'write_only': True}
        }
        
class CustomUserSerializer(serializers.ModelSerializer):
    employee_details = EmployeesSerializer(required=False)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 
                 'password', 'user_type', 'is_superuser','employee_details']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        employee_data = validated_data.pop('employee_details', None)
        password = validated_data.pop('password', None)
        
        # Create the user first
        user = CustomUser.objects.create(**validated_data)
        
        if password:
            user.set_password(password)
            user.save()

        # Then create employee details if they exist
        if employee_data:
            Employees.objects.create(user=user, **employee_data)
        
        return user

    def update(self, instance, validated_data):
        # Remove password from validated_data to prevent updates
        if 'password' in validated_data:
            validated_data.pop('password')
            
        employee_data = validated_data.pop('employee_details', None)

        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()

        # Update or create employee details
        if employee_data:
            employee, created = Employees.objects.update_or_create(
                user=instance,
                defaults=employee_data
            )

        return instance

class PunchTimeSerializer(serializers.ModelSerializer):
    employee = serializers.SerializerMethodField(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(),
        write_only=True
    )

    class Meta:
        model = PunchTime
        fields = ['id', 'employee', 'punch_in_time', 'punch_out_time', 'date', 'user_id']

    def get_employee(self, obj):
        return {
            "id": obj.employee.user_id,
            "emp_code": obj.employee.emp_code,
            "department": obj.employee.emp_department,
            "user": {
                "id": obj.employee.user.id,
                "username": obj.employee.user.username,
                "first_name": obj.employee.user.first_name,
                "last_name": obj.employee.user.last_name,
            }
        }

    def create(self, validated_data):
        user = validated_data.pop('user_id')
        try:
            employee = Employees.objects.get(user=user)
        except Employees.DoesNotExist:
            raise serializers.ValidationError({"user_id": "No employee associated with this user."})

        validated_data['employee'] = employee
        return PunchTime.objects.create(**validated_data)
class LeaveSerializer(serializers.ModelSerializer):
    employee = EmployeesSerializer(read_only=True)  
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(),
        write_only=True  
    )

    class Meta:
        model = Leave
        fields = ['id', 'employee', 'user_id', 'leave_type', 'start_date', 
                  'end_date', 'reason', 'status', 'created_at', 'modified_at']
        read_only_fields = ['status', 'created_at', 'modified_at']

    def create(self, validated_data):
        user = validated_data.pop('user_id')  # Extract user ID
        try:
            employee = Employees.objects.get(user=user)  # Fetch related employee
        except Employees.DoesNotExist:
            raise serializers.ValidationError({"user_id": "No employee associated with this user."})
        
        validated_data['employee'] = employee  # Assign employee
        leave = Leave.objects.create(**validated_data)  # Create leave entry
        
        return leave  # Return leave instance with populated data
# Create and return Leave object


# from rest_framework import serializers
# from .models import CustomUser, Employees, Leave, PunchTime


# class EmployeesSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Employees
#         fields = '__all__'  # Ensure all fields are included

# class CustomUserSerializer(serializers.ModelSerializer):
#     password = serializers.CharField(write_only=True)
#     employee_details = EmployeesSerializer(source='employees', read_only=True)  # Fetch Employee details

#     class Meta:
#         model = CustomUser
#         fields = ['id', 'username', 'first_name', 'last_name','is_superuser', 'email', 'user_type', 'password', 'employee_details']

#     def create(self, validated_data):
#         password = validated_data.pop('password', None)
#         user = CustomUser.objects.create(**validated_data)
#         if password:
#             user.set_password(password)
#             user.save()
#         return user



# class LeaveSerializer(serializers.ModelSerializer):
#     employee = EmployeesSerializer()

#     class Meta:
#         model = Leave
#         fields = ['id', 'employee', 'leave_type', 'start_date', 'end_date', 'status', 'created_at', 'modified_at']

# class PunchTimeSerializer(serializers.ModelSerializer):
#     employee = EmployeesSerializer() 

#     class Meta:
#         model = PunchTime
#         fields = ['id', 'employee', 'punch_in_time', 'punch_out_time', 'date', 'created_at', 'modified_at']
