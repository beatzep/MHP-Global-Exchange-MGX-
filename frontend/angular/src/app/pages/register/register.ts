import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  register(): void {
    this.errorMessage = '';

    if (!this.name || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Bitte füllen Sie alle Felder aus';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwörter stimmen nicht überein';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Passwort muss mindestens 6 Zeichen lang sein';
      return;
    }

    this.isLoading = true;

    this.authService.register(this.name, this.email, this.password).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.router.navigate(['/']);
        } else {
          this.errorMessage = response.message || 'Registrierung fehlgeschlagen';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Verbindungsfehler. Bitte versuchen Sie es später erneut.';
        console.error('Registration error:', error);
      }
    });
  }
}
