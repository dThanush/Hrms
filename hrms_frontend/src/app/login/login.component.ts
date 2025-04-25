import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  messages: { type: string; text: string }[] = [];
  isLoading = false;

  constructor(private http: HttpClient, private router: Router) {
    this.loginForm = new FormGroup({
      username: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required),
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.messages = [{ type: 'error', text: 'Please fill in all fields correctly.' }];
      return;
    }

    this.isLoading = true;
    const { username, password } = this.loginForm.value;

    // Remove duplicate /api/ from URL
    this.http.post('http://127.0.0.1:8000/api/api/token/', { username, password }).subscribe({
      next: (response: any) => {
        if (response?.access) {
          localStorage.setItem('token', response.access);
          
          this.getCurrentUserDetails(username);
        } else {
          this.handleError('Invalid server response');
        }
      },
      error: (error) => {
        this.handleError(error.error?.detail || 'Invalid credentials');
      }
    });
  }

  getCurrentUserDetails(username: string) {
    const token = localStorage.getItem('token');
    if (!token) {
      this.handleError('No token found');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // Use a more specific endpoint if available, or filter the users list
    this.http.get<any[]>('http://localhost:8000/api/api/users/', { headers }).subscribe({
      next: (users) => {
        const user = users.find(u => u.username === username);
        
        if (!user) {
          this.handleError('User not found');
          return;
        }

        // Debug: Check what user data is being received
        console.log('User data:', user);
        
        // Store all relevant user information
        localStorage.setItem('user_id', user.id);
        localStorage.setItem('username', user.username);
        localStorage.setItem('user_type', user.user_type?.toString() || '2');
        localStorage.setItem('is_superuser', user.is_superuser ? 'true' : 'false');
        
        // Check if user is superuser or admin (user_type 1)
        if (user.is_superuser) {
          this.router.navigate(['/dashboard']); // Superuser/Admin dashboard
      } else if (user.user_type === 2) { // Normal Employee
          this.router.navigate(['/dashboard']); // Employee Dashboard
      }
      },
      error: (error) => {
        this.handleError(error.error?.detail || 'Failed to fetch user details');
      }
    });
  }

  private handleError(message: string) {
    this.isLoading = false;
    this.messages = [{ type: 'error', text: message }];
    localStorage.clear();
  }
}
// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { Router } from '@angular/router';
// import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';

// @Component({
//   selector: 'app-login',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule],
//   templateUrl: './login.component.html',
//   styleUrls: ['./login.component.css']
// })
// export class LoginComponent {
//   loginForm: FormGroup;
//   messages: { type: string; text: string }[] = [];

//   constructor(private http: HttpClient, private router: Router) {
//     this.loginForm = new FormGroup({
//       username: new FormControl('', Validators.required),
//       password: new FormControl('', Validators.required),
//     });
//   }

//   onSubmit(): void {
//     if (this.loginForm.invalid) {
//       this.messages = [{ type: 'error', text: 'Please fill in all fields correctly.' }];
//       return;
//     }
  
//     const { username, password } = this.loginForm.value;
//     this.http.post('http://127.0.0.1:8000/api/api/token/', { username, password }).subscribe(
//       (response: any) => {
//         if (response && response.access) {
//           localStorage.setItem('token', response.access);
          
//           this.getUserDetails();  // Only redirect after fetching user details
//         } else {
//           this.messages = [{ type: 'error', text: 'Invalid server response' }];
//         }
//       },
//       error => {
//         console.error('Login failed:', error);
//         this.messages = [{ type: 'error', text: 'Invalid credentials or API issue' }];
//       }
//     );
//   }
//   getUserDetails() {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       this.messages = [{ type: 'error', text: 'No token found. Login again.' }];
//       return;
//     }
  
//     this.http.get('http://localhost:8000/api/api/users/me/', { 
//       headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
//     }).subscribe(
//       (user: any) => {
//         console.log("API Response:", user);  
  
//         if (!user || user.is_superuser === undefined) {
//           console.warn('is_superuser field is missing. Defaulting to false.');
//           user.is_superuser = false; // Default to false if missing
//         }
  
//         localStorage.setItem('user_type', user.user_type.toString());
//         localStorage.setItem('is_superuser', user.is_superuser.toString());
  
//         this.router.navigate([user.is_superuser ? '/dashboard' : '/dashboard']);
//       },
//       error => {
//         console.error('Fetching user details failed:', error);
//         this.messages = [{ type: 'error', text: 'Could not retrieve user details' }];
//       }
//     );
//   }
  
// }
    
  // getUserDetails() {
  //   const token = localStorage.getItem('token');
  //   if (!token) {
  //     this.messages = [{ type: 'error', text: 'No token found. Login again.' }];
  //     return;
  //   }

  //   this.http.get('http://localhost:8000/api/api/users/', {
  //     headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
  //   }).subscribe(
  //     (user: any) => {
  //       localStorage.setItem('user_type', user.user_type);
        
  //       console.log("dk")
  //       console.log("user:",user.user_type)
  //       this.router.navigate([user.is_superuser ? '/admin' : '/user']);
  //     },
  //     error => {
  //       console.error('Fetching user details failed:',);
  //       this.messages = [{ type: 'error', text: 'Could not retrieve user details' }];
  //     }
  //   );
  // }

