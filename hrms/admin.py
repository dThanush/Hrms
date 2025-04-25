from django.contrib import admin
from .models import CustomUser, Employees, Leave, PunchTime


class CustomUserAdmin(admin.ModelAdmin):
    list_display = ['username', 'first_name', 'last_name', 'user_type', 'created_at', 'modified_at']  # Removed 'profile_pic'
    search_fields = ['username', 'first_name', 'last_name']
    list_filter = ['user_type']

admin.site.register(CustomUser, CustomUserAdmin)



class EmployeesAdmin(admin.ModelAdmin):
    list_display = ['user','mobile_number', 'emp_code', 'emp_department',  'created_at', 'modified_at']  # Corrected field names
    search_fields = ['emp_code']
    list_filter = ['emp_department']  # Ensure these exist in Employees model

admin.site.register(Employees, EmployeesAdmin)



class LeaveAdmin(admin.ModelAdmin):
    list_display = ['employee', 'leave_type', 'start_date', 'end_date', 'status', 'created_at', 'modified_at']
    search_fields = ['employee__admin__username', 'leave_type']
    list_filter = ['status']

admin.site.register(Leave, LeaveAdmin)

class PunchTimeAdmin(admin.ModelAdmin):
    list_display = ['employee', 'punch_in_time', 'punch_out_time', 'date', 'created_at', 'modified_at']
    search_fields = ['employee__admin__username']
    list_filter = ['date']

admin.site.register(PunchTime, PunchTimeAdmin)


# Removed the RoleAdmin and role registration as well
# admin.site.register(Attendance, AttendanceAdmin)
# admin.site.register(Leave, LeaveAdmin)

# from django.contrib import admin
# from .models import Role, Attendance, Leave

# class AttendanceAdmin(admin.ModelAdmin):
#     list_display = ['employee', 'punch_in', 'punch_out', 'date', 'created_by', 'modified_by', 'created_at', 'updated_at']
#     search_fields = ['employee__username']

# class LeaveAdmin(admin.ModelAdmin):
#     list_display = ['employee', 'leave_type', 'start_date', 'end_date', 'status', 'created_by', 'modified_by', 'created_at', 'updated_at']
#     search_fields = ['employee__username']

# class RoleAdmin(admin.ModelAdmin):
#     list_display = ['name', 'created_by', 'modified_by', 'created_at', 'updated_at']

# admin.site.register(Attendance, AttendanceAdmin)
# admin.site.register(Leave, LeaveAdmin)
# admin.site.register(Role, RoleAdmin)
