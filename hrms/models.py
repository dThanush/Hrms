from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    USER_CHOICES = (
        (1, 'Admin'),
        (2, 'Employee'),
    )
    user_type = models.IntegerField(choices=USER_CHOICES, default=2)
    created_at = models.DateTimeField(auto_now_add=True) 
    modified_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.is_superuser:  
            self.user_type = 1
        super().save(*args, **kwargs)

class Employees(models.Model):
    user = models.OneToOneField(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='employee_details',
        primary_key=True
    )
    mobile_number = models.CharField(max_length=15)
    emp_code = models.CharField(max_length=20, unique=True)
    emp_department = models.CharField(max_length=100)
    # emp_designation = models.CharField(max_length=150)
    address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)  
    modified_at = models.DateTimeField(auto_now=True)    

class Leave(models.Model):
    employee = models.ForeignKey(Employees, on_delete=models.CASCADE)
    leave_type = models.CharField(max_length=50)  
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=[('Pending', 'Pending'), ('Approved', 'Approved'), ('Rejected', 'Rejected')], default='Pending')
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)  
    modified_at = models.DateTimeField(auto_now=True)    

    def __str__(self):
        return f"{self.employee.user.first_name} - {self.leave_type}"

class PunchTime(models.Model):
    employee = models.ForeignKey(Employees, on_delete=models.CASCADE)
    punch_in_time = models.DateTimeField()
    punch_out_time = models.DateTimeField(null=True, blank=True)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)  
    modified_at = models.DateTimeField(auto_now=True)    

    def __str__(self):
        return f"{self.employee.user.first_name} - {self.date}"
    
    def record_punch_in(self):
        self.punch_in_time = timezone.now()
        self.save()

    def record_punch_out(self):
        self.punch_out_time = timezone.now()
        self.save()


# from django.db import models
# from django.utils import timezone

# class Department(models.Model):
#     name = models.CharField(max_length=100)

#     def __str__(self):
#         return self.name

# class Employee(models.Model):
#     first_name = models.CharField(max_length=100)
#     last_name = models.CharField(max_length=100)
#     email = models.EmailField(unique=True)
#     department = models.ForeignKey(Department, on_delete=models.CASCADE)
#     joining_date = models.DateField()
#     salary = models.FloatField()

#     def __str__(self):
#         return f"{self.first_name} {self.last_name}"

# class Attendance(models.Model):
#     employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
#     punch_in = models.DateTimeField(null=True, blank=True)
#     punch_out = models.DateTimeField(null=True, blank=True)
#     date = models.DateField(default=timezone.now)

#     def __str__(self):
#         return f"{self.employee.first_name} {self.employee.last_name} - {self.date}"

#     def punch_in_time(self):
#         self.punch_in = timezone.now()
#         self.save()

#     def punch_out_time(self):
#         self.punch_out = timezone.now()
#         self.save()
