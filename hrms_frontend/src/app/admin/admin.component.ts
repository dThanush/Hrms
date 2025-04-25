import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Component, OnInit, Input } from '@angular/core';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  @Input() selectedSection: string = 'dashboard';
  userRole: string | null = null;
  authToken: string | null = null;

  users: any[] = [];
  punchTimes: any[] = [];
  leaves: any[] = [];
  userForm: FormGroup;
  showUserForm = false;
  editMode = false;
  selectedUserId: number | null = null;
  userSearch: string = '';
  leaveSearch: string = '';
  punchSearch: string = '';

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      first_name: ['', Validators.required],
      last_name: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.editMode ? [] : [Validators.required]],
      user_type: ['2'],
      // Employee fields
      mobile_number: ['', Validators.required],
      emp_code: ['', Validators.required],
      emp_department: ['', Validators.required],
      address: ['', Validators.required],

    });
  }    

  ngOnInit() {
    this.authToken = localStorage.getItem('token');
    this.userRole = Number(localStorage.getItem('user_type')) === 1 ? 'admin' : 'employee';

    if (!this.authToken) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.userRole !== 'admin') {
      this.router.navigate(['/user']);
      return;
    }

    this.fetchUsers();
    this.fetchPunchTimes();
    this.fetchLeaves();
  }

  getAuthHeaders(): HttpHeaders {
    if (!this.authToken) {
      console.error("No auth token found!");
      return new HttpHeaders();
    }
    return new HttpHeaders({
      Authorization: `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    });
  }

  fetchUsers() {
    this.http.get<any[]>('http://localhost:8000/api/api/users/', { headers: this.getAuthHeaders() })
      .subscribe({
        next: (data) => {
          this.users = data;
        },
        error: (error) => {
          console.error('Error fetching users:', error);
        }
      });
  }

  fetchPunchTimes() {
    this.http.get('http://localhost:8000/api/api/punchtimes/', { headers: this.getAuthHeaders() })
      .subscribe({
        next: (data: any) => this.punchTimes = data,
        error: (error) => console.error('Error fetching punch times:', error)
      });
  }

  fetchLeaves() {
    this.http.get('http://localhost:8000/api/api/leaves/', { headers: this.getAuthHeaders() })
      .subscribe({
        next: (data: any) => this.leaves = data,
        error: (error) => console.error('Error fetching leaves:', error)
      });
  }

  openUserForm(user?: any) {
    this.showUserForm = true;
    this.editMode = !!user;
    
    if (user) {
      this.selectedUserId = user.id;
      
      // Format the data for the form
      const formData = {
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        password: '', 
        user_type: user.user_type.toString(),
        mobile_number: user.employee_details?.mobile_number || '',
        emp_code: user.employee_details?.emp_code || '',
        emp_department: user.employee_details?.emp_department || '',
        // emp_designation: user.employee_details?.emp_designation || '',
        address: user.employee_details?.address || '',
      };
      
      this.userForm.patchValue(formData);
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
    } else {
      this.selectedUserId = null;
      this.userForm.reset({
        user_type: '2'
      });
      this.userForm.get('password')?.setValidators([Validators.required]);
      this.userForm.get('password')?.updateValueAndValidity();
    }
  }

  closeUserForm() {
    this.showUserForm = false;
    this.userForm.reset();
    this.editMode = false;
    this.selectedUserId = null;
  }

  submitUserForm() {
    if (this.userForm.invalid) {
      alert('Please fill all required fields');
      return;
    }

    if (this.editMode) {
      this.updateUser();
    } else {
      this.createUser();
    }
  }

  createUser() {
    const formData = {
        username: this.userForm.value.username,
        first_name: this.userForm.value.first_name,
        last_name: this.userForm.value.last_name,
        email: this.userForm.value.email,
        password: this.userForm.value.password,
        user_type: Number(this.userForm.value.user_type),
        employee_details: {
            mobile_number: this.userForm.value.mobile_number,
            emp_code: this.userForm.value.emp_code,
            emp_department: this.userForm.value.emp_department,
            address: this.userForm.value.address,
        }
    };

    console.log('Sending data:', formData);

    this.http.post('http://localhost:8000/api/api/users/', formData, { 
        headers: this.getAuthHeaders() 
    }).subscribe({
        next: (response: any) => {
            alert('User created successfully');
            this.fetchUsers();
            this.closeUserForm();
        },
        error: (error) => {
            console.error('Error creating user:', error);
            const errorMsg = error.error?.detail || 
                           error.error?.message || 
                           JSON.stringify(error.error);
            alert(`Failed to create user: ${errorMsg}`);
        }
    });
}

updateUser() {
    if (!this.selectedUserId) return;

    const formData = {
        username: this.userForm.value.username,
        first_name: this.userForm.value.first_name,
        last_name: this.userForm.value.last_name,
        email: this.userForm.value.email,
        user_type: Number(this.userForm.value.user_type),
        employee_details: {
            mobile_number: this.userForm.value.mobile_number,
            emp_code: this.userForm.value.emp_code,
            emp_department: this.userForm.value.emp_department,
            // emp_designation: this.userForm.value.emp_designation,
            address: this.userForm.value.address,
           
        }
    };


    this.http.patch(`http://localhost:8000/api/api/employees/${this.selectedUserId}/`, formData, { 
        headers: this.getAuthHeaders() 
    }).subscribe({
        next: (response: any) => {
            alert('User updated successfully');
            this.fetchUsers();
            this.closeUserForm();
        },
        error: (error) => {
            console.error('Error updating user:', error);
            const errorMsg = error.error?.detail || 
                           error.error?.message || 
                           JSON.stringify(error.error);
            alert(`Failed to update user: ${errorMsg}`);
        }
    });
}

  deleteUser(id: number) {
    if (confirm("Are you sure you want to delete this user?")) {
      this.http.delete(`http://localhost:8000/api/api/users/${id}/`, { headers: this.getAuthHeaders() })
        .subscribe({
          next: () => {
            alert('User deleted successfully');
            this.fetchUsers();
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            alert('Error deleting user');
          }
        });
    }
  }

  updateLeaveStatus(id: number, status: string) {
    this.http.patch(`http://localhost:8000/api/api/leaves/${id}/`, { status }, { headers: this.getAuthHeaders() })
      .subscribe({
        next: () => {
          alert(`Leave request ${status}`);
          this.fetchLeaves();
        },
        error: (error) => {
          console.error(`Error updating leave status:`, error);
          alert('Error updating leave status');
        }
      });
  }

  approveLeave(id: number) {
    this.updateLeaveStatus(id, 'approved');
  }

  rejectLeave(id: number) {
    this.updateLeaveStatus(id, 'rejected');
  }

  filteredUsers() {
    return this.users.filter(user =>
      (user.first_name + ' ' + (user.last_name || '')).toLowerCase().includes(this.userSearch.toLowerCase())
    );
  }
  
  // filteredLeaves() {
  //   return this.leaves.filter(leave =>
  //     (leave.employee?.user?.first_name + ' ' + (leave.employee?.user?.last_name || '')).toLowerCase()
  //       .includes(this.leaveSearch.toLowerCase()));
  // }

  filteredLeaves() {
    const filtered = this.leaves.filter(leave =>
        (leave.employee?.user?.first_name + ' ' + (leave.employee?.user?.last_name || '')).toLowerCase()
            .includes(this.leaveSearch.toLowerCase())
    );

    console.log('Filtered Leaves:', filtered); // Log the filtered results

    return filtered;
    }


  filteredPunchTimes() {
    return this.punchTimes.filter(punch =>
      (punch.employee?.user?.first_name + ' ' + (punch.employee?.user?.last_name || '')).toLowerCase()
        .includes(this.punchSearch.toLowerCase())
    );
  }
}

// import { CommonModule } from '@angular/common';
// import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
// import { Component, OnInit, Input } from '@angular/core';
// import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
// import { Router } from '@angular/router';

// @Component({
//   selector: 'app-admin',
//   standalone: true,
//   imports: [CommonModule, HttpClientModule, FormsModule, ReactiveFormsModule],
//   templateUrl: './admin.component.html',
//   styleUrls: ['./admin.component.css']
// })
// export class AdminComponent implements OnInit {
//   @Input() selectedSection: string = 'dashboard';
//   userRole: string | null = null;
//   authToken: string | null = null;

//   users: any[] = [];
//   punchTimes: any[] = [];
//   leaves: any[] = [];
//   userForm: FormGroup;
//   showUserForm = false;
//   editMode = false;
//   selectedUserId: number | null = null;
//   userSearch: string = '';
//   leaveSearch: string = '';
//   punchSearch: string = '';

//   constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
//     this.userForm = this.fb.group({
//       username: [''],
//       first_name: [''],
//       last_name: [''],
//       email: [''],
//       password: [''],
//       mobileNumber: [''],
//       empcode: [''],
//       department: [''],
//       designation: [''],
//       address: [''],
//       joiningDate: [''],
//       user_type: ['2'],
//     });
//   }

//   ngOnInit() {
//     this.authToken = localStorage.getItem('token');
//     this.userRole = Number(localStorage.getItem('user_type')) === 1 ? 'admin' : 'employee';

//     if (!this.authToken) {
//       this.router.navigate(['/login']);
//       return;
//     }

//     if (this.userRole !== 'admin') {
//       this.router.navigate(['/user']);
//       return;
//     }

//     this.fetchUsers();
//     this.fetchPunchTimes();
//     this.fetchLeaves();
//   }

//   getAuthHeaders(): HttpHeaders {
//     if (!this.authToken) {
//       console.error("No auth token found!");
//       return new HttpHeaders();
//     }
//     return new HttpHeaders({
//       Authorization: `Bearer ${this.authToken}`,
//       'Content-Type': 'application/json'
//     });
//   }

//   fetchUsers() {
//     this.http.get<any[]>('http://localhost:8000/api/api/users/', { headers: this.getAuthHeaders() })
//       .subscribe({
//         next: (data) => {
//           console.log('Users API Response:', data); // Debugging
//           this.users = data.map(user => ({
//             ...user,
//             employee_details: user.employee_details ?? {
//               mobilenumber: '',
//               empcode: '',
//               empdept: '',
//               empdesignation: '',
//               address: '',
//               joiningdate: ''
//             }
//           }));
//         },
//         error: (error) => {
//           console.error('Error fetching users:', error);
//         }
//       });
//   }

//   fetchPunchTimes() {
//     this.http.get('http://localhost:8000/api/api/punchtime/', { headers: this.getAuthHeaders() })
//       .subscribe({
//         next: (data: any) => this.punchTimes = data,
//         error: (error) => console.error('Error fetching punch times:', error)
//       });
//   }

//   fetchLeaves() {
//     this.http.get('http://localhost:8000/api/api/leaves/', { headers: this.getAuthHeaders() })
//       .subscribe({
//         next: (data: any) => this.leaves = data,
//         error: (error) => console.error('Error fetching leaves:', error)
//       });
//   }

//   openUserForm(user?: any) {
//     this.showUserForm = true;
//     if (user) {
//       this.editMode = true;
//       this.selectedUserId = user.id;

//       // Ensure employee_details exists
//       const employeeDetails = user.employee_details ?? {
//         mobilenumber: '',
//         empcode: '',
//         empdept: '',
//         empdesignation: '',
//         address: '',
//         joiningdate: ''
//       };

//       this.userForm.patchValue({
//         username: user.username || '',
//         first_name: user.first_name || '',
//         last_name: user.last_name || '',
//         email: user.email || '',
//         mobileNumber: employeeDetails.mobilenumber || '',
//         empcode: employeeDetails.empcode || '',
//         department: employeeDetails.empdept || '',
//         designation: employeeDetails.empdesignation || '',
//         address: employeeDetails.address || '',
//         joiningDate: employeeDetails.joiningdate || '',
//         user_type: user.user_type || '2',
//       });
//     } else {
//       this.editMode = false;
//       this.userForm.reset();
//     }
//   }

//   closeUserForm() {
//     this.showUserForm = false;
//     this.userForm.reset();
//     this.editMode = false;
//     this.selectedUserId = null;
//   }

//   createUser() {
//     const formData = {
//       ...this.userForm.value,
//       user_type: Number(this.userForm.value.user_type),
//       password: this.userForm.value.password,
//       employee_details: {
//         mobilenumber: this.userForm.value.mobileNumber,
//         empcode: this.userForm.value.empcode,
//         empdept: this.userForm.value.department,
//         empdesignation: this.userForm.value.designation,
//         address: this.userForm.value.address,
//         joiningdate: this.userForm.value.joiningDate,
//       }
//     };

//     console.log('Form Data:', formData);

//     if (!formData.password) {
//       alert("Password is required.");
//       return;
//     }

//     this.http.post('http://localhost:8000/api/api/users/', formData, { headers: this.getAuthHeaders() })
//       .subscribe({
//         next: () => {
//           alert('User created successfully');
//           this.fetchUsers();
//           this.closeUserForm();
//         },
//         error: (error) => {
//           alert(`Failed to create user: ${error.status} - ${JSON.stringify(error.error)}`);
//         }
//       });
//   }

//   updateUser() {
//     if (!this.selectedUserId) return;

//     const updatedData = {
//       ...this.userForm.value,
//       employee_details: {
//         mobilenumber: this.userForm.value.mobileNumber,
//         empcode: this.userForm.value.empcode,
//         empdept: this.userForm.value.department,
//         empdesignation: this.userForm.value.designation,
//         address: this.userForm.value.address,
//         joiningdate: this.userForm.value.joiningDate,
//       }
//     };

//     console.log('Updated Data:', updatedData);

//     this.http.patch(`http://localhost:8000/api/api/users/${this.selectedUserId}/`, updatedData, { headers: this.getAuthHeaders() })
//       .subscribe({
//         next: () => {
//           alert('User updated successfully');
//           this.fetchUsers();
//           this.closeUserForm();
//         },
//         error: (error) => {
//           alert('Error updating user');
//           console.error('Failed to update user:', error);
//         }
//       });
//   }

//   deleteUser(id: number) {
//     if (confirm("Are you sure you want to delete this user?")) {
//       this.http.delete(`http://localhost:8000/api/api/users/${id}/`, { headers: this.getAuthHeaders() })
//         .subscribe({
//           next: () => this.fetchUsers(),
//           error: (error) => console.error('Error deleting user:', error)
//         });
//     }
//   }
//   updateLeaveStatus(id: number, status: string) {
//     this.http.patch(`http://localhost:8000/api/api/leaves/${id}/update_status/`, { status }, { headers: this.getAuthHeaders() })
//       .subscribe({
//         next: () => {
//           alert(`Leave request ${status}`);
//           this.fetchLeaves();
//         },
//         error: (error) => console.error(`Error updating leave status:`, error)
//       });
//   }
  
//   approveLeave(id: number) {
//     this.updateLeaveStatus(id, 'approved');
//   }
  
//   rejectLeave(id: number) {
//     this.updateLeaveStatus(id, 'rejected');
//   }
  
//   filteredUsers() {
//     return this.users.filter(user =>
//       (user.first_name + ' ' + user.last_name).toLowerCase().includes(this.userSearch.toLowerCase())
//     );
//   }
//   filteredLeaves() {
//     return this.leaves.filter(leave =>
//       leave.employee?.full_name.toLowerCase().includes(this.leaveSearch.toLowerCase())
//     );
//   }

//   filteredPunchTimes() {
//     return this.punchTimes.filter(punch =>
//       punch.employee?.full_name.toLowerCase().includes(this.punchSearch.toLowerCase())
//     );
//   }
// }

// import { CommonModule } from '@angular/common';
// import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
// import { Component, OnInit, Input } from '@angular/core';
// import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
// import { Router } from '@angular/router';

// @Component({
//   selector: 'app-admin',
//   standalone: true,
//   imports: [CommonModule, HttpClientModule, FormsModule,ReactiveFormsModule],
//   providers: [HttpClient],
//   templateUrl: './admin.component.html',
//   styleUrls: ['./admin.component.css']
// })
// export class AdminComponent implements OnInit {
//   @Input() selectedSection: string = 'dashboard';
//   userRole: string | null = null;

//   users: any[] = [];
//   punchTimes: any[] = [];
//   leaves: any[] = [];
//   userForm: FormGroup;
//   showUserForm = false;
//   editMode = false;
//   selectedUserId: number | null = null;
//   userSearch: string = '';
//   leaveSearch: string = '';
//   punchSearch: string = '';
//   authToken: string | null = null;

//   constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
//     this.userForm = this.fb.group({
//       username: [''],
//       fullName: [''],
//       email: [''],
//       password: [''],
//       mobileNumber: [''],
//       empcode: [''],
//       department: [''],
//       designation: [''],
//       address: [''],
//       joiningDate: [''],
//       user_type: ['2'],
//     });
//   }

//   ngOnInit() {
//     this.authToken = localStorage.getItem('token');
//     this.userRole = Number(localStorage.getItem('user_type')) === 1 ? 'admin' : 'employee';

//     if (!this.authToken) {
//       this.router.navigate(['/login']);
//       return;
//     }

//     if (this.userRole !== 'admin') {
//       this.router.navigate(['/user']);
//       return;
//     }

//     this.fetchUsers();
//     this.fetchPunchTimes();
//     this.fetchLeaves();
//   }

//   getAuthHeaders() {
//     return new HttpHeaders({
//       Authorization: `Bearer ${localStorage.getItem('token')}`,
//       'Content-Type': 'application/json'
//     });
//   }

//   openUserForm(user: any = null) {
//     this.showUserForm = true;
//     this.editMode = !!user;
//     this.selectedUserId = user ? user.id : null;

//     if (user) {
//       this.userForm.patchValue({
//         username: user.username,
//         fullName: user.full_name,
//         email: user.email,
//         password: '',
//         mobileNumber: user.mobile_number,
//         empcode: user.empcode,
//         department: user.department,
//         designation: user.designation,
//         address: user.address,
//         joiningDate: user.joining_date,
//         user_type: user.user_type
//       });
//     } else {
//       this.userForm.reset();
//     }
//   }
//   closeUserForm() {
//     this.showUserForm = false;
//     this.userForm.reset();
//     this.editMode = false;
//     this.selectedUserId = null;
//   }
  
//   createUser() {
//     const formData = this.userForm.value;
//     formData.user_type = Number(formData.user_type);

//     this.http.post('http://localhost:8000/api/api/users/', formData, { headers: this.getAuthHeaders() })
//       .subscribe({
//         next: () => {
//           alert('User created successfully');
//           this.fetchUsers();
//         },
//         error: (error) => {
//           alert(`Failed to create user: ${error.status} - ${JSON.stringify(error.error)}`);
//         }
//       });
//   }

//   updateUser() {
//     if (this.selectedUserId) {
//       this.http.put(`http://localhost:8000/api/api/users/${this.selectedUserId}/`, this.userForm.value, { headers: this.getAuthHeaders() })
//         .subscribe(() => {
//           alert('User updated successfully');
//           this.fetchUsers();
//           this.showUserForm = false;
//           this.userForm.reset();
//           this.selectedUserId = null;
//         });
//     }
//   }

//   deleteUser(id: number) {
//     if (confirm("Are you sure you want to delete this user?")) {
//       this.http.delete(`http://localhost:8000/api/api/users/${id}/`, { headers: this.getAuthHeaders() })
//         .subscribe(() => this.fetchUsers());
//     }
//   }

//   fetchUsers() {
//     this.http.get('http://localhost:8000/api/api/users/', { headers: this.getAuthHeaders() })
//       .subscribe((data: any) => this.users = data);
//   }

//   fetchPunchTimes() {
//     this.http.get('http://localhost:8000/api/api/punchtime/', { headers: this.getAuthHeaders() })
//       .subscribe((data: any) => this.punchTimes = data);
//   }

//   fetchLeaves() {
//     this.http.get('http://localhost:8000/api/api/leaves/', { headers: this.getAuthHeaders() })
//       .subscribe((data: any) => this.leaves = data);
//   }

//   updateLeaveStatus(id: number, status: string) {
//     this.http.patch(`http://localhost:8000/api/api/leaves/${id}/update_status/`, { status }, { headers: this.getAuthHeaders() })
//       .subscribe(() => this.fetchLeaves());
//   }

//   approveLeave(id: number) {
//     this.updateLeaveStatus(id, 'approved');
//   }

//   rejectLeave(id: number) {
//     this.updateLeaveStatus(id, 'rejected');
//   }

//   filteredUsers() {
//     return this.users.filter(user => user.full_name.toLowerCase().includes(this.userSearch.toLowerCase()));
//   }

//   filteredLeaves() {
//     return this.leaves.filter(leave => leave.employee.full_name.toLowerCase().includes(this.leaveSearch.toLowerCase()));
//   }

//   filteredPunchTimes() {
//     return this.punchTimes.filter(punch => punch.employee.full_name.toLowerCase().includes(this.punchSearch.toLowerCase()));
//   }
// }


// import { CommonModule } from '@angular/common';
// import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
// import { Component, OnInit } from '@angular/core';
// import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
// import { Router } from '@angular/router';

// @Component({
//   selector: 'app-admin',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, FormsModule],
//   providers:[Router],
//   templateUrl: './admin.component.html',
//   styleUrl: './admin.component.css'
// })
// export class AdminComponent implements OnInit {
 
//   users: any[] = [];
//   punchTimes: any[] = [];
//   leaves: any[] = [];
//   userForm: FormGroup;
//   showUserForm = false;
//   editMode = false;
//   selectedUserId: number | null = null;
//   userSearch: string = '';
//   leaveSearch: string = '';
//   punchSearch: string = '';

//   constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
//     this.userForm = this.fb.group({
//       fullName: [''],
//       email: [''],
//       password: [''],
//       mobileNumber: [''],
//       empcode: [''],
//       department: [''],
//       designation: [''],
//       address: [''],
//       joiningDate: [''],
//       user_type: ['2'], // Default Employee
//     });
//   }

//   ngOnInit() {
//     const userType = localStorage.getItem('user_type');

//     if (userType !== '1') {  // Assuming '1' is Admin
//       this.router.navigate(['/user']);  // Redirect to user dashboard
//     } else {
//       this.fetchUsers();
//       this.fetchPunchTimes();
//       this.fetchLeaves();
//     }
//   }

//   openUserForm(user: any = null) {
//     this.showUserForm = true;
//     this.editMode = !!user;
//     this.selectedUserId = user ? user.id : null;

//     if (user) {
//       this.userForm.patchValue(user);
//     } else {
//       this.userForm.reset();
//     }
//   }

//   createUser() {
//     this.http.post('http://localhost:8000/api/users/', this.userForm.value, this.getAuthHeaders())
//       .subscribe(() => {
//         alert('User created successfully');
//         this.fetchUsers();
//         this.showUserForm = false;
//         this.userForm.reset();
//       });
//   }

//   updateUser() {
//     if (this.selectedUserId) {
//       this.http.put(`http://localhost:8000/api/users/${this.selectedUserId}/`, this.userForm.value, this.getAuthHeaders())
//         .subscribe(() => {
//           alert('User updated successfully');
//           this.fetchUsers();
//           this.showUserForm = false;
//           this.userForm.reset();
//           this.selectedUserId = null;
//         });
//     }
//   }

//   deleteUser(id: number) {
//     if (confirm("Are you sure you want to delete this user?")) {
//       this.http.delete(`http://localhost:8000/api/users/${id}/`, this.getAuthHeaders())
//         .subscribe(() => this.fetchUsers());
//     }
//   }

//   fetchUsers() {
//     this.http.get('http://localhost:8000/api/users/', this.getAuthHeaders())
//       .subscribe((data: any) => this.users = data);
//   }

//   fetchPunchTimes() {
//     this.http.get('http://localhost:8000/api/punchtime/', this.getAuthHeaders())
//       .subscribe((data: any) => this.punchTimes = data);
//   }

//   fetchLeaves() {
//     this.http.get('http://localhost:8000/api/leaves/', this.getAuthHeaders())
//       .subscribe((data: any) => this.leaves = data);
//   }

//   updateLeaveStatus(id: number, status: string) {
//     this.http.patch(`http://localhost:8000/api/leaves/${id}/update_status/`, { status }, this.getAuthHeaders())
//       .subscribe(() => this.fetchLeaves());
//   }
//   approveLeave(id: number) {
//     this.updateLeaveStatus(id, 'approved');
//   }
  
//   rejectLeave(id: number) {
//     this.updateLeaveStatus(id, 'rejected');
//   }

//   filteredUsers() {
//     return this.users.filter(user => user.first_name.toLowerCase().includes(this.userSearch.toLowerCase()));
//   }

//   filteredLeaves() {
//     return this.leaves.filter(leave => leave.employee.admin.first_name.toLowerCase().includes(this.leaveSearch.toLowerCase()));
//   }

//   filteredPunchTimes() {
//     return this.punchTimes.filter(punch => punch.employee.admin.first_name.toLowerCase().includes(this.punchSearch.toLowerCase()));
//   }

//   private getAuthHeaders() {
//     return {
//       headers: new HttpHeaders({
//         'Authorization': 'Bearer ' + localStorage.getItem('token'),
//         'Content-Type': 'application/json'
//       })
//     };
//   }
// }
