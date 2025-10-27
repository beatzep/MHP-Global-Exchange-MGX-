import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { GuessTheChartService, GameRound, LeaderboardEntry } from './guess-the-chart.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-guess-the-chart',
  standalone: true,
  imports: [CommonModule, NgxChartsModule, RouterModule],
  templateUrl: './guess-the-chart.html',
  styleUrl: './guess-the-chart.css'
})
export class GuessTheChartComponent implements OnInit, OnDestroy {
  currentRound = 0;
  totalRounds = 4;
  score = 0;
  gameState: 'playing' | 'correct' | 'wrong' | 'finished' = 'playing';
  selectedAnswer: string | null = null;

  rounds: GameRound[] = [];
  currentGameRound: GameRound | null = null;

  isLoading = false;
  isAuthenticated = false;
  currentUser: any = null;

  // Timer
  startTime: number = 0;
  elapsedTime: number = 0;
  timerInterval: any;

  // Leaderboard
  leaderboard: LeaderboardEntry[] = [];
  showLeaderboard = false;
  scoreSaved = false;

  // Joker
  jokerAvailable = true;
  jokerUsed = false;
  eliminatedOptions: string[] = [];

  constructor(
    private gameService: GuessTheChartService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Check authentication
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAuthenticated = !!user;
    });

    // Load leaderboard
    this.loadLeaderboard();

    this.startNewGame();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  startNewGame() {
    this.currentRound = 0;
    this.score = 0;
    this.gameState = 'playing';
    this.selectedAnswer = null;
    this.isLoading = true;
    this.scoreSaved = false;
    this.elapsedTime = 0;

    // Reset joker
    this.jokerAvailable = true;
    this.jokerUsed = false;
    this.eliminatedOptions = [];

    // Stop previous timer if exists
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.gameService.getGameRounds(this.totalRounds).subscribe({
      next: (rounds) => {
        this.rounds = rounds;
        this.currentGameRound = rounds[0];
        this.isLoading = false;

        // Start timer
        this.startTimer();
      },
      error: (err) => {
        console.error('Error loading game rounds:', err);
        this.isLoading = false;
      }
    });
  }

  startTimer() {
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  selectAnswer(answer: string) {
    if (this.gameState !== 'playing') return;
    // Prevent selecting eliminated options
    if (this.isOptionEliminated(answer)) return;

    this.selectedAnswer = answer;

    if (answer === this.currentGameRound?.correctAnswer) {
      this.score++;
      this.gameState = 'correct';
    } else {
      this.gameState = 'wrong';
    }
  }

  nextRound() {
    this.currentRound++;

    if (this.currentRound >= this.totalRounds) {
      this.gameState = 'finished';
      this.stopTimer();

      // Save score if authenticated
      if (this.isAuthenticated && !this.scoreSaved) {
        this.saveScore();
      }
    } else {
      this.currentGameRound = this.rounds[this.currentRound];
      this.gameState = 'playing';
      this.selectedAnswer = null;
      // Reset eliminated options for new round
      this.eliminatedOptions = [];
    }
  }

  saveScore() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('No auth token found');
      return;
    }

    this.gameService.submitScore({
      score: this.score,
      totalRounds: this.totalRounds,
      timeTaken: this.elapsedTime
    }, token).subscribe({
      next: (response) => {
        console.log('Score saved successfully', response);
        this.scoreSaved = true;
        this.loadLeaderboard(); // Reload leaderboard to show new score
      },
      error: (err) => {
        console.error('Error saving score:', err);
      }
    });
  }

  loadLeaderboard() {
    this.gameService.getLeaderboard(10).subscribe({
      next: (leaderboard) => {
        this.leaderboard = leaderboard;
      },
      error: (err) => {
        console.error('Error loading leaderboard:', err);
      }
    });
  }

  toggleLeaderboard() {
    this.showLeaderboard = !this.showLeaderboard;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getRelativeTime(playedAt: string): string {
    const now = new Date();
    const played = new Date(playedAt);
    const diffMs = now.getTime() - played.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
    if (diffHours > 0) return `vor ${diffHours} Stunde${diffHours > 1 ? 'n' : ''}`;
    if (diffMins > 0) return `vor ${diffMins} Minute${diffMins > 1 ? 'n' : ''}`;
    return 'gerade eben';
  }

  useJoker() {
    if (!this.jokerAvailable || this.jokerUsed || this.gameState !== 'playing') {
      return;
    }

    // Get wrong answers
    const wrongAnswers = this.currentGameRound?.options.filter(
      option => option !== this.currentGameRound?.correctAnswer
    ) || [];

    // Randomly select 2 wrong answers to eliminate
    const shuffled = [...wrongAnswers].sort(() => Math.random() - 0.5);
    this.eliminatedOptions = shuffled.slice(0, 2);

    // Mark joker as used
    this.jokerUsed = true;
    this.jokerAvailable = false;
  }

  isOptionEliminated(option: string): boolean {
    return this.eliminatedOptions.includes(option);
  }

  getButtonClass(option: string): string {
    // Check if option is eliminated
    if (this.isOptionEliminated(option)) {
      return 'eliminated';
    }

    if (this.gameState === 'playing') {
      return this.selectedAnswer === option ? 'selected' : '';
    }

    if (option === this.currentGameRound?.correctAnswer) {
      return 'correct';
    }

    if (this.selectedAnswer === option && option !== this.currentGameRound?.correctAnswer) {
      return 'wrong';
    }

    return '';
  }
}
