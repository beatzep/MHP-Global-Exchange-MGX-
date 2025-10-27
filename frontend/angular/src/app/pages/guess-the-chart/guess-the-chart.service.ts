import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { Color, ScaleType } from '@swimlane/ngx-charts';

export interface GameRound {
  symbol: string;
  chartData: any[];
  colorScheme: Color;
  options: string[];
  correctAnswer: string;
}

export interface LeaderboardEntry {
  id: number;
  userName: string;
  score: number;
  totalRounds: number;
  timeTaken: number;
  playedAt: string;
  rank: number;
}

export interface SubmitScoreRequest {
  score: number;
  totalRounds: number;
  timeTaken: number;
}

const DEFAULT_CHART_COLOR_SCHEME: Color = {
  domain: ['#26a69a'],
  group: ScaleType.Linear,
  selectable: true,
  name: 'Stock'
};

@Injectable({
  providedIn: 'root'
})
export class GuessTheChartService {
  private apiUrl = 'http://localhost:8080/api/game';

  constructor(private http: HttpClient) {}

  getGameRounds(numberOfRounds: number): Observable<GameRound[]> {
    return this.http.get<any>(`${this.apiUrl}/guess-the-chart?rounds=${numberOfRounds}`).pipe(
      map(response => {
        return response.rounds.map((round: any) => {
          const series = round.chartData.t.map((time: number, index: number) => ({
            name: new Date(time * 1000),
            value: round.chartData.c[index]
          }));

          const firstPrice = series.length > 0 ? series[0].value : 0;
          const lastPrice = series.length > 0 ? series[series.length - 1].value : 0;

          const colorScheme = {
            ...DEFAULT_CHART_COLOR_SCHEME,
            domain: [lastPrice >= firstPrice ? '#26a69a' : '#ef5350']
          };

          return {
            symbol: round.symbol,
            chartData: [{ name: round.symbol, series }],
            colorScheme,
            options: round.options,
            correctAnswer: round.correctAnswer
          };
        });
      })
    );
  }

  submitScore(score: SubmitScoreRequest, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': token,
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.apiUrl}/submit-score`, score, { headers });
  }

  getLeaderboard(limit: number = 10): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${this.apiUrl}/leaderboard?limit=${limit}`);
  }

  getMyScores(token: string): Observable<any[]> {
    const headers = new HttpHeaders({
      'Authorization': token
    });

    return this.http.get<any[]>(`${this.apiUrl}/my-scores`, { headers });
  }
}
