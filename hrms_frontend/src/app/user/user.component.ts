import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Component, OnInit, Input } from '@angular/core';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {
  @Input() selectedSection: string = 'dashboard';
  authToken: string | null = null;
  userId: number | null = null;
  employeeId: number | null = null;
  user: any = {};
  myPunchRecords: any[] = [];
  myLeaveRecords: any[] = [];
  leaveForm: FormGroup;
  hasPunchedIn: boolean = false;
  hasPunchedOut: boolean = false;
  showLeaveForm: boolean = false;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.leaveForm = this.fb.group({
      leave_type: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      reason: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.authToken = localStorage.getItem('token');
    this.userId = Number(localStorage.getItem('user_id'));

    if (!this.authToken || !this.userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.fetchUserProfile();
    this.fetchPunchTimes();
    this.fetchLeaves();
  }

  getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    });
  }

  fetchUserProfile() {
    this.http.get(`http://localhost:8000/api/api/users/${this.userId}/`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (data: any) => {
        this.user = {
          username: data.username,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          mobile_number: data.employee_details?.mobile_number || '',
          emp_code: data.employee_details?.emp_code || '',
          emp_department: data.employee_details?.emp_department || '',
          address: data.employee_details?.address || '',
        };

        // Use userId as the employee ID since employee_details does not contain an id field
        this.employeeId = this.userId;

        if (!this.employeeId) {
          alert('Employee ID not found. Please reload the page or contact admin.');
          return;
        }

        this.fetchPunchTimes();
      },
      error: (error) => {
        console.error('Error fetching user profile:', error);
        alert('Failed to load user profile');
      }
    });
  }

  fetchPunchTimes() {
    if (!this.employeeId) {
      return; // Don't proceed if employee ID isn't available
    }

    this.http.get(`http://localhost:8000/api/api/punchtimes/?employee=${this.employeeId}`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (data: any) => {
        this.myPunchRecords = data;
        if (this.myPunchRecords.length > 0) {
          const lastPunch = this.myPunchRecords[this.myPunchRecords.length - 1];
          this.hasPunchedIn = !!lastPunch.punch_in_time && !lastPunch.punch_out_time;
          this.hasPunchedOut = !!lastPunch.punch_out_time;
        }
      },
      error: (error) => {
        console.error('Error fetching punch times:', error);
        alert('Failed to load punch records');
      }
    });
  }

  punchIn() {
    if (!this.employeeId) {
      alert('Employee ID not found. Please reload the page or contact admin.');
      return;
    }

    const punchData = {
      employee_id: this.employeeId, 
      date: new Date().toISOString().split('T')[0],
      punch_in_time: new Date().toISOString() 
    };
    
    console.log('Punch In Request:', punchData);
    
    this.http.post('http://localhost:8000/api/api/punchtimes/', punchData, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: () => {
        alert('Punched in successfully');
        this.fetchPunchTimes();
      },
      error: (error) => {
        console.error('Error punching in:', error);
        alert('Failed to punch in: ' + JSON.stringify(error.error));
      }
    });
    
  }

  punchOut() {
    if (!this.hasPunchedIn || this.myPunchRecords.length === 0) {
      alert('No active punch in found');
      return;
    }

    const lastPunchId = this.myPunchRecords[this.myPunchRecords.length - 1].id;

    this.http.patch(
      `http://localhost:8000/api/api/punchtimes/${lastPunchId}/`,
      { punch_out_time: new Date().toISOString() },
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: () => {
        alert('Punched out successfully');
        this.fetchPunchTimes();
      },
      error: (error) => {
        console.error('Error punching out:', error);
        alert('Failed to punch out: ' + (error.error?.message || 'Unknown error'));
      }
    });
  }

  fetchLeaves() {
    this.http.get(`http://localhost:8000/api/api/leaves/?user=${this.userId}`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (data: any) => this.myLeaveRecords = data,
      error: (error) => {
        console.error('Error fetching leaves:', error);
        alert('Failed to load leave records');
      }
    });
  }

  requestLeave() {
    if (this.leaveForm.invalid) {
      alert('Please fill all required fields');
      return;
    }
  
    const leaveData = { 
      ...this.leaveForm.value, 
      user_id: this.userId // Ensure 'user_id' is sent, not 'user'
    };
  
    this.http.post('http://localhost:8000/api/api/leaves/', leaveData, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: () => {
        alert('Leave request submitted');
        this.leaveForm.reset();
        this.fetchLeaves();
      },
      error: (error) => {
        console.error('Error submitting leave request:', error);
        alert('Failed to submit leave request: ' + (error.error?.message || 'Unknown error'));
      }
    });
  }
  

  openLeaveForm() {
    this.showLeaveForm = true;
  }

  closeLeaveForm() {
    this.showLeaveForm = false;
  }
}
