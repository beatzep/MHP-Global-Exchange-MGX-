import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-einstellungen',
  imports: [CommonModule, FormsModule],
  templateUrl: './einstellungen.html',
  styleUrls: ['./einstellungen.css']
})
export class EinstellungenComponent implements OnInit {
  // Profile data
  name = '';
  email = '';

  // Password change
  currentPassword = '';
  newPassword = '';
  confirmNewPassword = '';

  // Status messages
  profileMessage = '';
  profileMessageType: 'success' | 'error' = 'success';
  passwordMessage = '';
  passwordMessageType: 'success' | 'error' = 'success';

  // Loading states
  isProfileLoading = false;
  isPasswordLoading = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.name = user.name;
      this.email = user.email;
    }
  }

  updateProfile(): void {
    this.profileMessage = '';

    if (!this.name || !this.email) {
      this.profileMessage = 'Bitte füllen Sie alle Felder aus';
      this.profileMessageType = 'error';
      return;
    }

    this.isProfileLoading = true;

    this.authService.updateProfile(this.name, this.email).subscribe({
      next: (response) => {
        this.isProfileLoading = false;
        if (response.success) {
          this.profileMessage = 'Profil erfolgreich aktualisiert';
          this.profileMessageType = 'success';
        } else {
          this.profileMessage = response.message || 'Profil-Aktualisierung fehlgeschlagen';
          this.profileMessageType = 'error';
        }
      },
      error: (error) => {
        this.isProfileLoading = false;
        this.profileMessage = 'Verbindungsfehler. Bitte versuchen Sie es später erneut.';
        this.profileMessageType = 'error';
        console.error('Profile update error:', error);
      }
    });
  }

  changePassword(): void {
    this.passwordMessage = '';

    if (!this.currentPassword || !this.newPassword || !this.confirmNewPassword) {
      this.passwordMessage = 'Bitte füllen Sie alle Felder aus';
      this.passwordMessageType = 'error';
      return;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.passwordMessage = 'Neue Passwörter stimmen nicht überein';
      this.passwordMessageType = 'error';
      return;
    }

    if (this.newPassword.length < 6) {
      this.passwordMessage = 'Neues Passwort muss mindestens 6 Zeichen lang sein';
      this.passwordMessageType = 'error';
      return;
    }

    this.isPasswordLoading = true;

    this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: (response) => {
        this.isPasswordLoading = false;
        if (response.success) {
          this.passwordMessage = 'Passwort erfolgreich geändert';
          this.passwordMessageType = 'success';
          // Clear password fields
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmNewPassword = '';
        } else {
          this.passwordMessage = response.message || 'Passwort-Änderung fehlgeschlagen';
          this.passwordMessageType = 'error';
        }
      },
      error: (error) => {
        this.isPasswordLoading = false;
        this.passwordMessage = error.error?.message || 'Verbindungsfehler. Bitte versuchen Sie es später erneut.';
        this.passwordMessageType = 'error';
        console.error('Password change error:', error);
      }
    });
  }
}
