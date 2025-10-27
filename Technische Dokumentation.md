# MHP Global Exchange (MGX) - Technische Dokumentation

## Inhaltsverzeichnis
1. [Projektübersicht](#projektübersicht)
2. [Architektur](#architektur)
3. [Backend - Spring Boot](#backend---spring-boot)
4. [Frontend - Angular](#frontend---angular)
5. [Guess the Chart Funktion](#guess-the-chart-funktion)
6. [Dependencies und Libraries](#dependencies-und-libraries)
7. [API Integration](#api-integration)
8. [Datenfluss](#datenfluss)

---

## Projektübersicht

MHP Global Exchange (MGX) ist eine vollständige Stock-Market-Anwendung mit folgenden Hauptfunktionen:
- **Echtzeit-Aktienpreise**: Live-Streaming von Aktienkursen über Server-Sent Events (SSE)
- **Historische Charts**: Visualisierung von Kursentwicklungen über 90 Tage
- **Watchlist**: Personalisierte Liste von beobachteten Aktien, ETFs und Anleihen
- **Guess the Chart**: Interaktives Spiel zum Erraten von Aktien anhand ihrer Charts
- **Benutzer-Authentifizierung**: Login/Register mit Token-basierter Authentifizierung
- **Leaderboard**: Rangliste der besten Spieler im Guess-the-Chart-Modus

---

## Architektur

### Technologie-Stack

#### Backend
- **Framework**: Spring Boot 3.3.0
- **Build-Tool**: Maven
- **Datenbankzugriff**: Spring Data JPA
- **Reactive Programming**: Spring WebFlux
- **Security**: Spring Security (BCrypt für Passwort-Hashing)

#### Frontend
- **Framework**: Angular 20.3.0
- **Charting-Libraries**:
  - `@swimlane/ngx-charts` (Version 23.0.1)
  - `lightweight-charts` (Version 5.0.9)
- **Reactive Programming**: RxJS 7.8.0

#### Datenbanken
- **Produktion**: MariaDB
- **Entwicklung/Test**: H2 (In-Memory-Datenbank)

---

## Backend - Spring Boot

### Ordnerstruktur

```
backend/src/main/java/com/mhp/exchange/
├── config/              # Konfigurationsklassen (CORS, Security)
├── market/              # Marktdaten-Modul
│   ├── api/            # REST-Controller und DTOs
│   └── domain/         # Domain-Modelle
├── user/                # Benutzer-Modul
│   ├── api/            # Auth-Controller, Token-Service
│   └── domain/         # User-Entity, Repository
├── game/                # Guess-the-Chart-Modul
│   ├── api/            # Game-Controller, DTOs
│   └── domain/         # GameScore-Entity, Repository
├── trading/             # Trading-Modul (Stub)
└── portfolio/           # Portfolio-Modul (Stub)
```

### Wichtige Backend-Komponenten

#### 1. MarketController (`market/api/MarketController.java`)

**Zweck**: Bereitstellung von Echtzeit-Marktdaten und historischen Charts

**Endpunkte**:
- `GET /api/market/prices` - Streamt Aktienpreise via SSE
- `GET /api/market/prices/{category}` - Streamt Preise nach Kategorie (stocks/etfs/bonds)
- `GET /api/market/candles/{symbol}` - Lädt historische Kerzendaten für ein Symbol

**Technische Details**:
```java
// Load-Balancing zwischen zwei API-Keys
private synchronized String getNextApiKey() {
    requestCounter++;
    return (requestCounter % 2 == 0) ? finnhubApiKey : finnhubApiKey2;
}

// Rate-Limiting mit 450ms Verzögerung + 2 parallele Requests
return Flux.fromIterable(symbols)
    .delayElements(Duration.ofMillis(450))
    .flatMap(this::fetchStockData, 2);
```

**Wichtige Features**:
- **Reactive Streams**: Verwendet `Flux` und `Mono` für nicht-blockierende API-Aufrufe
- **Rate-Limiting**: 450ms Verzögerung zwischen Requests, max. 2 parallele Anfragen
- **Load-Balancing**: Wechselt automatisch zwischen zwei Finnhub API-Keys
- **Error-Handling**: `.onErrorResume()` für graceful Fehlerbehandlung

#### 2. GameController (`game/api/GameController.java`)

**Zweck**: Backend-Logik für das Guess-the-Chart-Spiel

**Endpunkte**:
- `GET /api/game/guess-the-chart?rounds=4` - Erstellt ein neues Spiel mit n Runden
- `POST /api/game/submit-score` - Speichert einen Score (authentifiziert)
- `GET /api/game/leaderboard?limit=10` - Lädt die Top-10-Leaderboard
- `GET /api/game/my-scores` - Lädt persönliche Scores (authentifiziert)

**Spiellogik**:
```java
// 1. Zufällige Auswahl von Aktien aus einem Pool von 20 Symbolen
List<String> selectedStocks = new ArrayList<>(STOCK_POOL);
Collections.shuffle(selectedStocks);

// 2. Für jede Aktie: 3 falsche Antworten + 1 richtige Antwort
List<String> wrongAnswers = new ArrayList<>(STOCK_POOL);
wrongAnswers.remove(correctSymbol);
Collections.shuffle(wrongAnswers);
wrongAnswers = wrongAnswers.subList(0, 3);

// 3. Chart-Daten von TwelveData API laden (90 Tage)
Mono<GameRound> roundMono = getChartData(correctSymbol)
    .map(chartData -> {
        // GameRound mit Symbol, ChartData, Options, CorrectAnswer
    });
```

**Scoring-System**:
- Score: Anzahl der richtigen Antworten
- Zeit: Gesamtzeit in Sekunden
- Ranking: Sortiert nach Score (absteigend), dann nach Zeit (aufsteigend)

#### 3. AuthController (`user/api/AuthController.java`)

**Zweck**: Benutzer-Authentifizierung und Profilverwaltung

**Endpunkte**:
- `POST /api/auth/login` - Login mit E-Mail und Passwort
- `POST /api/auth/register` - Registrierung neuer Benutzer
- `POST /api/auth/change-password` - Passwort ändern (authentifiziert)
- `POST /api/auth/update-profile` - Profil aktualisieren (authentifiziert)
- `GET /api/auth/validate` - Token validieren
- `POST /api/auth/logout` - Logout und Token-Entfernung

**Sicherheit**:
```java
// Passwort-Hashing mit BCrypt
String hashedPassword = passwordEncoder.encode(request.getPassword());

// Token-Generierung
String token = UUID.randomUUID().toString();
tokenService.storeToken(token, user.getEmail());
```

### Backend-Dependencies (pom.xml)

| Dependency | Version | Zweck |
|------------|---------|-------|
| `spring-boot-starter-web` | 3.3.0 | REST-API, MVC |
| `spring-boot-starter-webflux` | 3.3.0 | Reactive Programming, WebClient, SSE |
| `spring-boot-starter-data-jpa` | 3.3.0 | Datenbankzugriff, Repositories |
| `spring-boot-starter-security` | 3.3.0 | Passwort-Hashing (BCrypt) |
| `mariadb-java-client` | Runtime | MariaDB-Datenbanktreiber |
| `h2` | Runtime | In-Memory-Datenbank für Tests |

---

## Frontend - Angular

### Ordnerstruktur

```
frontend/angular/src/app/
├── pages/                      # Seiten-Komponenten
│   ├── home/                  # Dashboard mit Aktienliste und Chart
│   ├── guess-the-chart/       # Guess-the-Chart-Spiel
│   ├── markets/               # Märkte-Übersicht
│   ├── portfolio/             # Portfolio (Stub)
│   ├── login/                 # Login-Seite
│   ├── register/              # Registrierung
│   ├── einstellungen/         # Einstellungen
│   ├── news/                  # News (Stub)
│   ├── hilfe/                 # Hilfe
│   └── ueberuns/              # Über uns
├── services/                   # Services
│   ├── auth.service.ts        # Authentifizierung
│   ├── watchlist.service.ts   # Watchlist-Verwaltung
│   ├── theme.service.ts       # Dark/Light-Mode
│   └── trading.service.ts     # Trading (Stub)
└── app.routes.ts              # Routing-Konfiguration
```

### Wichtige Frontend-Komponenten

#### 1. HomeComponent (`pages/home/home.ts`)

**Zweck**: Hauptseite mit Live-Aktienkursen und Chart-Visualisierung

**Technische Details**:
```typescript
// Timer-basierte Aktualisierung alle 60 Sekunden
const REFRESH_INTERVAL = 60000;

// SSE-Stream für Aktienpreise
const allStockPrices$ = timer(0, REFRESH_INTERVAL).pipe(
  switchMap(() =>
    this.marketService.getPricesStreamByCategory('stocks').pipe(
      scan((acc, value) => [...acc, value], [] as MarketData[])
    )
  )
);

// Filterung nach Watchlist
this.stockPrices$ = combineLatest([allStockPrices$, this.watchlistService.watchlist$]).pipe(
  map(([prices, watchlist]) => {
    return prices.filter(price => watchlist.stocks.includes(price.symbol));
  })
);
```

**Features**:
- **Kategorien**: Aktien, ETFs, Anleihen (separate Streams)
- **Watchlist-Integration**: Zeigt nur beobachtete Symbole an
- **Chart-Anzeige**: Klick auf Aktie öffnet 90-Tage-Chart
- **Live-Updates**: Automatische Aktualisierung alle 60 Sekunden

#### 2. MarketService (`pages/home/market.service.ts`)

**Zweck**: Kommunikation mit Backend für Marktdaten

**EventSource für SSE**:
```typescript
getPricesStreamByCategory(category: string): Observable<MarketData> {
  return new Observable((observer: Observer<MarketData>) => {
    const eventSource = new EventSource(`${this.apiUrl}/prices/${category}`);

    eventSource.onmessage = (event) => {
      const newPrice = JSON.parse(event.data);
      observer.next(newPrice);
    };

    eventSource.onerror = (error) => observer.error(error);

    return () => eventSource.close();
  });
}
```

**Chart-Daten-Transformation**:
```typescript
getChartData(stock: MarketData): Observable<ChartData> {
  return this.getHistory(stock.symbol).pipe(
    map(apiResponse => {
      // Konvertierung von Unix-Timestamps zu Date-Objekten
      const series = apiResponse.t.map((time: number, index: number) => ({
        name: new Date(time * 1000),
        value: apiResponse.c[index]
      }));

      // Farbwahl basierend auf Preisentwicklung
      const firstPrice = series[0].value;
      const lastPrice = series[series.length - 1].value;
      const colorScheme = {
        domain: [lastPrice >= firstPrice ? colors.positive : colors.negative]
      };

      return { chartData: [{ name: stock.symbol, series }], colorScheme };
    })
  );
}
```

#### 3. GuessTheChartComponent (`pages/guess-the-chart/guess-the-chart.ts`)

**Zweck**: Interaktives Spiel zum Erraten von Aktien anhand ihrer Charts

**Spiel-Zustände**:
```typescript
gameState: 'playing' | 'correct' | 'wrong' | 'finished' = 'playing';
```

**Spielablauf**:
```typescript
startNewGame() {
  // 1. Reset der Variablen
  this.currentRound = 0;
  this.score = 0;
  this.jokerAvailable = true;

  // 2. Runden vom Backend laden
  this.gameService.getGameRounds(this.totalRounds).subscribe({
    next: (rounds) => {
      this.rounds = rounds;
      this.currentGameRound = rounds[0];
      this.startTimer();
    }
  });
}

selectAnswer(answer: string) {
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
    // Score speichern wenn authentifiziert
    if (this.isAuthenticated) {
      this.saveScore();
    }
  } else {
    this.currentGameRound = this.rounds[this.currentRound];
    this.gameState = 'playing';
  }
}
```

**Joker-Funktion (50:50)**:
```typescript
useJoker() {
  // Filtere falsche Antworten
  const wrongAnswers = this.currentGameRound?.options.filter(
    option => option !== this.currentGameRound?.correctAnswer
  ) || [];

  // Wähle zufällig 2 falsche Antworten zum Eliminieren
  const shuffled = [...wrongAnswers].sort(() => Math.random() - 0.5);
  this.eliminatedOptions = shuffled.slice(0, 2);

  this.jokerUsed = true;
  this.jokerAvailable = false;
}
```

**Timer-System**:
```typescript
startTimer() {
  this.startTime = Date.now();
  this.timerInterval = setInterval(() => {
    this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
  }, 1000);
}

formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
```

#### 4. GuessTheChartService (`pages/guess-the-chart/guess-the-chart.service.ts`)

**Zweck**: Kommunikation mit Backend für Spieldaten

**Daten-Transformation**:
```typescript
getGameRounds(numberOfRounds: number): Observable<GameRound[]> {
  return this.http.get<any>(`${this.apiUrl}/guess-the-chart?rounds=${numberOfRounds}`).pipe(
    map(response => {
      return response.rounds.map((round: any) => {
        // Konvertierung der Backend-Daten zu Chart-Format
        const series = round.chartData.t.map((time: number, index: number) => ({
          name: new Date(time * 1000),
          value: round.chartData.c[index]
        }));

        // Farbschema basierend auf Preisentwicklung
        const firstPrice = series[0].value;
        const lastPrice = series[series.length - 1].value;
        const colorScheme = {
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
```

**Score-Submission**:
```typescript
submitScore(score: SubmitScoreRequest, token: string): Observable<any> {
  const headers = new HttpHeaders({
    'Authorization': token,
    'Content-Type': 'application/json'
  });

  return this.http.post(`${this.apiUrl}/submit-score`, score, { headers });
}
```

### Frontend-Dependencies (package.json)

| Dependency | Version | Zweck |
|------------|---------|-------|
| `@angular/core` | 20.3.0 | Angular-Framework |
| `@angular/common` | 20.3.0 | Common-Module (HTTP, Pipes) |
| `@angular/router` | 20.3.0 | Routing |
| `@angular/forms` | 20.3.0 | Formulare |
| `@angular/cdk` | 20.2.8 | Component Dev Kit |
| `@swimlane/ngx-charts` | 23.0.1 | Deklarative Charts mit D3.js |
| `lightweight-charts` | 5.0.9 | Performante Trading-Charts |
| `rxjs` | 7.8.0 | Reactive Programming |
| `zone.js` | 0.15.0 | Change Detection |

---

## Guess the Chart Funktion

### Überblick

Die Guess-the-Chart-Funktion ist ein interaktives Lernspiel, bei dem Spieler Aktien anhand ihrer Chart-Verläufe erraten müssen.

### Funktionsweise

#### Backend-Seite (GameController.java)

1. **Spielerstellung** (`GET /api/game/guess-the-chart?rounds=4`):
   ```
   1. Zufällige Auswahl von n Aktien aus STOCK_POOL (20 Symbole)
   2. Für jede ausgewählte Aktie:
      a) 3 falsche Antworten aus verbleibenden Symbolen wählen
      b) Alle 4 Optionen mischen
      c) Chart-Daten von TwelveData API laden (90 Tage, 1-Tages-Intervall)
   3. Rückgabe als GameResponse mit Array von GameRounds
   ```

2. **Datenstruktur**:
   ```java
   class GameRound {
       String symbol;              // Richtige Antwort
       CandleData chartData;       // Chart-Daten (Timestamps + Preise)
       List<String> options;       // 4 Antwortmöglichkeiten
       String correctAnswer;       // Richtige Antwort (= symbol)
   }
   ```

3. **Score-Speicherung** (`POST /api/game/submit-score`):
   ```java
   GameScore {
       String userEmail;
       String userName;
       int score;              // Anzahl richtiger Antworten
       int totalRounds;        // Gesamtzahl Runden
       int timeTaken;          // Zeit in Sekunden
       LocalDateTime playedAt; // Zeitstempel
   }
   ```

4. **Leaderboard** (`GET /api/game/leaderboard?limit=10`):
   ```sql
   SELECT * FROM game_scores
   ORDER BY score DESC, time_taken ASC
   LIMIT 10
   ```

#### Frontend-Seite (GuessTheChartComponent)

1. **Spielinitialisierung**:
   ```
   - Anfrage an Backend für n Runden
   - Timer starten
   - Erste Runde anzeigen
   ```

2. **Spielablauf pro Runde**:
   ```
   1. Chart anzeigen (ngx-charts-line-chart)
   2. 4 Antwortmöglichkeiten als Buttons
   3. Optional: 50:50-Joker nutzen (eliminiert 2 falsche Antworten)
   4. Antwort auswählen
   5. Feedback anzeigen (richtig/falsch)
   6. Button "Nächste Runde" / "Ergebnis anzeigen"
   ```

3. **Spielende**:
   ```
   - Timer stoppen
   - Finalen Score anzeigen
   - Bei authentifizierten Usern: Score ans Backend senden
   - Leaderboard anzeigen
   ```

### Spielmechaniken

#### Joker-System (50:50)

**Frontend-Logik**:
```typescript
useJoker() {
  // 1. Falsche Antworten filtern
  const wrongAnswers = this.currentGameRound?.options.filter(
    option => option !== this.currentGameRound?.correctAnswer
  );

  // 2. Zufällig 2 eliminieren
  const shuffled = [...wrongAnswers].sort(() => Math.random() - 0.5);
  this.eliminatedOptions = shuffled.slice(0, 2);

  // 3. Joker als verwendet markieren
  this.jokerUsed = true;
  this.jokerAvailable = false;
}
```

**Einschränkungen**:
- Nur 1x pro Spiel verwendbar
- Nur im Zustand 'playing' nutzbar
- Eliminierte Optionen werden mit ✗ markiert und disabled

#### Button-Styling

```typescript
getButtonClass(option: string): string {
  // Eliminiert durch Joker
  if (this.isOptionEliminated(option)) {
    return 'eliminated';
  }

  // Während des Spiels
  if (this.gameState === 'playing') {
    return this.selectedAnswer === option ? 'selected' : '';
  }

  // Nach der Antwort
  if (option === this.currentGameRound?.correctAnswer) {
    return 'correct';  // Grün
  }

  if (this.selectedAnswer === option) {
    return 'wrong';    // Rot
  }

  return '';
}
```

#### Leaderboard-Anzeige

**Features**:
- Top 10 Spieler
- Sortierung nach Score (absteigend), dann Zeit (aufsteigend)
- Highlight des eigenen Scores
- Badges für Platz 1-3 (Gold, Silber, Bronze)
- Relative Zeitangaben ("vor 5 Minuten", "vor 2 Stunden")

**Frontend-Template**:
```html
<tr *ngFor="let entry of leaderboard" [class.highlight]="entry.userName === currentUser?.name">
  <td class="rank">
    <span class="rank-badge"
          [class.gold]="entry.rank === 1"
          [class.silver]="entry.rank === 2"
          [class.bronze]="entry.rank === 3">
      {{ entry.rank }}
    </span>
  </td>
  <td>{{ entry.userName }}</td>
  <td>{{ entry.score }}/{{ entry.totalRounds }}</td>
  <td>{{ formatTime(entry.timeTaken) }}</td>
  <td>{{ getRelativeTime(entry.playedAt) }}</td>
</tr>
```

### Chart-Visualisierung

**Library**: `@swimlane/ngx-charts` (Line Chart)

**Konfiguration**:
```html
<ngx-charts-line-chart
  [results]="currentGameRound.chartData"
  [scheme]="currentGameRound.colorScheme"
  [legend]="false"
  [xAxis]="true"
  [yAxis]="true"
  [showXAxisLabel]="true"
  [showYAxisLabel]="true"
  xAxisLabel="Zeit"
  yAxisLabel="Preis (EUR)"
  [autoScale]="true">
</ngx-charts-line-chart>
```

**Farbschema**:
- **Grün** (#26a69a): Preis gestiegen (lastPrice >= firstPrice)
- **Rot** (#ef5350): Preis gefallen (lastPrice < firstPrice)

---

## Dependencies und Libraries

### Backend-Dependencies (Detailliert)

#### Spring Boot Starters

**spring-boot-starter-web**
- **Zweck**: REST-API-Entwicklung, MVC-Pattern
- **Beinhaltet**: Tomcat, Jackson, Spring MVC
- **Verwendung**: REST-Controller, Request-Mapping

**spring-boot-starter-webflux**
- **Zweck**: Reactive Programming, nicht-blockierende I/O
- **Beinhaltet**: Reactor, Netty, WebClient
- **Verwendung**:
  - WebClient für API-Aufrufe (Finnhub, TwelveData)
  - Flux für SSE-Streaming
  - Mono für asynchrone Responses

**spring-boot-starter-data-jpa**
- **Zweck**: Datenbankzugriff mit JPA/Hibernate
- **Beinhaltet**: Hibernate, Spring Data JPA
- **Verwendung**:
  - Repositories (UserRepository, GameScoreRepository, WatchlistRepository)
  - Entity-Mapping (@Entity, @Table)
  - Query-Methoden (findByEmail, findTopScores)

**spring-boot-starter-security**
- **Zweck**: Sicherheit, Passwort-Hashing
- **Beinhaltet**: Spring Security, BCrypt
- **Verwendung**:
  - PasswordEncoder für BCrypt-Hashing
  - CORS-Konfiguration

#### Datenbank-Treiber

**mariadb-java-client**
- **Zweck**: MariaDB-Datenbanktreiber
- **Scope**: Runtime
- **Verwendung**: Produktions-Datenbank

**h2**
- **Zweck**: In-Memory-Datenbank
- **Scope**: Runtime
- **Verwendung**: Entwicklung, Tests

### Frontend-Dependencies (Detailliert)

#### Angular-Core

**@angular/core**
- **Zweck**: Angular-Framework-Kern
- **Features**: Components, Services, Dependency Injection

**@angular/common**
- **Zweck**: Common-Module
- **Features**: HttpClient, CommonModule, Pipes (DatePipe, CurrencyPipe)

**@angular/router**
- **Zweck**: Client-side Routing
- **Features**: RouterModule, Routes, RouterLink

**@angular/forms**
- **Zweck**: Formular-Handling
- **Features**: FormsModule, ReactiveFormsModule, Validatoren

**@angular/cdk**
- **Zweck**: Component Development Kit
- **Features**: Accessibility, Overlay, Portal

#### Charting-Libraries

**@swimlane/ngx-charts (Version 23.0.1)**
- **Zweck**: Deklarative Charts für Angular
- **Basiert auf**: D3.js
- **Verwendung im Projekt**:
  ```typescript
  // Home-Page: Aktien-Charts
  <ngx-charts-line-chart
    [results]="chartData"
    [scheme]="colorScheme"
    [xAxis]="true"
    [yAxis]="true">
  </ngx-charts-line-chart>

  // Guess-the-Chart: Spiel-Charts
  <ngx-charts-line-chart
    [results]="currentGameRound.chartData"
    [scheme]="currentGameRound.colorScheme">
  </ngx-charts-line-chart>
  ```
- **Features**:
  - Line Charts, Bar Charts, Pie Charts
  - Responsive Design
  - Touch-Support
  - Animations

**lightweight-charts (Version 5.0.9)**
- **Zweck**: Hochperformante Trading-Charts
- **Hersteller**: TradingView
- **Verwendung**: Potenzielle Alternative für Candlestick-Charts
- **Features**:
  - Candlestick, Line, Area, Bar Charts
  - Real-time Updates
  - Touch-Gestures
  - Sehr performant (< 50KB gzipped)

#### Reactive Programming

**rxjs (Version 7.8.0)**
- **Zweck**: Reactive Extensions für JavaScript
- **Verwendung im Projekt**:
  ```typescript
  // Observables für Datenströme
  stockPrices$: Observable<MarketData[]>;

  // Operatoren
  import { map, filter, switchMap, scan, combineLatest } from 'rxjs/operators';

  // SSE-Integration
  return new Observable((observer) => {
    const eventSource = new EventSource(url);
    eventSource.onmessage = (event) => observer.next(data);
  });

  // Timer für Auto-Refresh
  timer(0, REFRESH_INTERVAL).pipe(
    switchMap(() => this.marketService.getPricesStream())
  );
  ```

#### Development-Dependencies

**TypeScript (Version 5.9.2)**
- **Zweck**: Typsicheres JavaScript
- **Features**: Interfaces, Generics, Type Guards

**Karma + Jasmine**
- **Zweck**: Unit-Testing
- **Karma**: Test-Runner
- **Jasmine**: Testing-Framework

---

## API Integration

### Externe APIs

#### 1. Finnhub API

**Zweck**: Echtzeit-Aktienkurse

**Endpunkt**: `https://finnhub.io/api/v1/quote`

**Request**:
```http
GET /quote?symbol=AAPL&token=YOUR_API_KEY
```

**Response**:
```json
{
  "c": 150.25,    // Current price
  "h": 152.10,    // High price of the day
  "l": 149.50,    // Low price of the day
  "o": 151.00,    // Open price
  "pc": 151.20,   // Previous close price
  "t": 1635523200 // Timestamp
}
```

**Rate-Limiting**:
- Free-Tier: 60 Requests/Minute
- Projekt-Lösung: Load-Balancing mit 2 API-Keys (120 Requests/Min)

**Backend-Integration**:
```java
private Mono<MarketData> fetchStockData(String symbol) {
    String apiKey = getNextApiKey(); // Load-Balancing
    return webClient.get()
        .uri(uriBuilder -> uriBuilder.path("/quote")
            .queryParam("symbol", symbol)
            .queryParam("token", apiKey)
            .build())
        .retrieve()
        .bodyToMono(FinnhubQuote.class)
        .map(quote -> quote.toMarketData(symbol));
}
```

#### 2. TwelveData API

**Zweck**: Historische Kerzendaten (90 Tage)

**Endpunkt**: `https://api.twelvedata.com/time_series`

**Request**:
```http
GET /time_series?symbol=AAPL&interval=1day&outputsize=90&apikey=YOUR_API_KEY
```

**Response**:
```json
{
  "meta": {
    "symbol": "AAPL",
    "interval": "1day"
  },
  "values": [
    {
      "datetime": "2024-01-15",
      "open": "151.00",
      "high": "152.10",
      "low": "149.50",
      "close": "150.25",
      "volume": "70000000"
    },
    ...
  ],
  "status": "ok"
}
```

**Backend-Integration**:
```java
@GetMapping("/candles/{symbol}")
public Mono<CandleData> getStockCandles(@PathVariable String symbol) {
    return WebClient.create("https://api.twelvedata.com/time_series").get()
        .uri(uriBuilder -> uriBuilder
            .queryParam("symbol", symbol)
            .queryParam("interval", "1day")
            .queryParam("outputsize", 90)
            .queryParam("apikey", twelveDataApiKey)
            .build())
        .retrieve()
        .bodyToMono(TwelveDataTimeSeriesResponse.class)
        .map(response -> {
            // Transformation zu CandleData
            List<Double> prices = new ArrayList<>();
            List<Long> timestamps = new ArrayList<>();

            response.getValues().forEach(value -> {
                timestamps.add(parseDate(value.getDatetime()));
                prices.add(Double.parseDouble(value.getClose()));
            });

            return new CandleData(prices, timestamps);
        });
}
```

---

## Datenfluss

### 1. Echtzeit-Aktienpreise (SSE)

```
┌─────────────────┐
│   Angular App   │
│   HomeComponent │
└────────┬────────┘
         │ EventSource
         ▼
┌─────────────────┐
│  MarketService  │
│  (Frontend)     │
└────────┬────────┘
         │ SSE Connection
         │ http://localhost:8080/api/market/prices
         ▼
┌─────────────────┐
│ MarketController│
│   (Backend)     │
└────────┬────────┘
         │ Flux.fromIterable(symbols)
         │ .delayElements(450ms)
         │ .flatMap(fetchStockData, 2)
         ▼
┌─────────────────┐
│   WebClient     │
│  (Spring Flux)  │
└────────┬────────┘
         │ API Request
         ▼
┌─────────────────┐
│   Finnhub API   │
│  (External)     │
└─────────────────┘

Datenfluss:
1. EventSource öffnet SSE-Verbindung
2. Backend lädt Symbole sequenziell (450ms delay)
3. Für jedes Symbol: API-Request zu Finnhub
4. Response wird zu MarketData konvertiert
5. MarketData wird über SSE gestreamt
6. Frontend empfängt Daten via EventSource.onmessage
7. RxJS scan-Operator sammelt Daten in Array
8. combineLatest filtert nach Watchlist
9. Template aktualisiert sich automatisch (Async Pipe)
```

### 2. Chart-Daten (HTTP)

```
┌─────────────────┐
│   HomeComponent │
│   showChart()   │
└────────┬────────┘
         │ click event
         ▼
┌─────────────────┐
│  MarketService  │
│  getChartData() │
└────────┬────────┘
         │ HTTP GET
         │ /api/market/candles/{symbol}
         ▼
┌─────────────────┐
│ MarketController│
│ getStockCandles()│
└────────┬────────┘
         │ WebClient.get()
         ▼
┌─────────────────┐
│ TwelveData API  │
│  (External)     │
└────────┬────────┘
         │ JSON Response
         ▼
┌─────────────────┐
│ MarketController│
│ map(response -> │
│   CandleData)   │
└────────┬────────┘
         │ Mono<CandleData>
         ▼
┌─────────────────┐
│  MarketService  │
│ map(apiResponse │
│ -> ChartData)   │
└────────┬────────┘
         │ Observable<ChartData>
         ▼
┌─────────────────┐
│   HomeComponent │
│ chartData = ... │
└────────┬────────┘
         ▼
┌─────────────────┐
│ ngx-charts      │
│ line-chart      │
└─────────────────┘
```

### 3. Guess-the-Chart Spielfluss

```
┌──────────────────────┐
│ GuessTheChartComponent│
│   startNewGame()      │
└──────────┬───────────┘
           │ HTTP GET
           │ /api/game/guess-the-chart?rounds=4
           ▼
┌──────────────────────┐
│   GameController     │
│ getGuessTheChartGame()│
└──────────┬───────────┘
           │ 1. Select random stocks
           │ 2. For each stock:
           ▼
┌──────────────────────┐
│   getChartData()     │
│ (Private method)     │
└──────────┬───────────┘
           │ WebClient.get()
           ▼
┌──────────────────────┐
│   TwelveData API     │
└──────────┬───────────┘
           │ Time series data
           ▼
┌──────────────────────┐
│   GameController     │
│ Combine all rounds   │
│ Flux.concat()        │
└──────────┬───────────┘
           │ GameResponse
           ▼
┌──────────────────────┐
│ GuessTheChartService │
│ Transform to GameRound│
└──────────┬───────────┘
           │ Observable<GameRound[]>
           ▼
┌──────────────────────┐
│ GuessTheChartComponent│
│ Display round 1       │
└──────────┬───────────┘
           │ User selects answer
           ▼
┌──────────────────────┐
│   selectAnswer()     │
│ Check correctness    │
└──────────┬───────────┘
           │ Correct → score++
           │ Incorrect → no change
           ▼
┌──────────────────────┐
│   nextRound()        │
│ currentRound++       │
└──────────┬───────────┘
           │ If finished:
           ▼
┌──────────────────────┐
│   saveScore()        │
│ (if authenticated)   │
└──────────┬───────────┘
           │ HTTP POST
           │ /api/game/submit-score
           ▼
┌──────────────────────┐
│   GameController     │
│   submitScore()      │
└──────────┬───────────┘
           │ Save to DB
           ▼
┌──────────────────────┐
│ GameScoreRepository  │
│   JPA save()         │
└──────────────────────┘
```

### 4. Authentifizierung

```
┌──────────────────┐
│  LoginComponent  │
│  onSubmit()      │
└────────┬─────────┘
         │ HTTP POST
         │ /api/auth/login
         │ { email, password }
         ▼
┌──────────────────┐
│  AuthController  │
│  login()         │
└────────┬─────────┘
         │ 1. Find user by email
         ▼
┌──────────────────┐
│ UserRepository   │
│ findByEmail()    │
└────────┬─────────┘
         │ Optional<User>
         ▼
┌──────────────────┐
│  AuthController  │
│ 2. Check password│
│ passwordEncoder  │
│   .matches()     │
└────────┬─────────┘
         │ 3. Generate token
         ▼
┌──────────────────┐
│  TokenService    │
│  storeToken()    │
└────────┬─────────┘
         │ Map<String, String>
         │ token -> email
         ▼
┌──────────────────┐
│  AuthController  │
│ Return LoginResponse│
│ { success, token, │
│   email, name }  │
└────────┬─────────┘
         │ JSON Response
         ▼
┌──────────────────┐
│  AuthService     │
│ (Frontend)       │
│ localStorage.    │
│ setItem('token') │
└────────┬─────────┘
         │ BehaviorSubject
         ▼
┌──────────────────┐
│  currentUser$    │
│  Observable      │
└──────────────────┘

Nachfolgende Requests:
┌──────────────────┐
│  Any Component   │
│  API Request     │
└────────┬─────────┘
         │ HTTP Header
         │ Authorization: token
         ▼
┌──────────────────┐
│  Backend         │
│  Controller      │
└────────┬─────────┘
         │ @RequestHeader
         ▼
┌──────────────────┐
│  TokenService    │
│  getEmailFromToken│
└────────┬─────────┘
         │ email or null
         ▼
┌──────────────────┐
│  Controller      │
│  Authorize action│
└──────────────────┘
```

---

## Zusammenfassung

### Backend-Technologien
- **Spring Boot 3.3.0**: Modernes Java-Framework
- **Spring WebFlux**: Reactive Programming für SSE und API-Calls
- **Spring Data JPA**: Datenbankzugriff mit Hibernate
- **Spring Security**: BCrypt-Passwort-Hashing
- **WebClient**: Nicht-blockierende HTTP-Requests

### Frontend-Technologien
- **Angular 20.3.0**: Moderne SPA-Architektur
- **RxJS 7.8.0**: Reactive Programming mit Observables
- **ngx-charts 23.0.1**: D3.js-basierte Charts
- **EventSource**: SSE für Echtzeit-Updates

### Externe APIs
- **Finnhub**: Echtzeit-Aktienkurse (60 Req/Min/Key)
- **TwelveData**: Historische Kerzendaten (90 Tage)

### Key-Features
- **Echtzeit-Streaming**: SSE mit automatischem Reconnect
- **Rate-Limiting**: Load-Balancing mit 2 API-Keys
- **Reactive Architecture**: Flux/Mono im Backend, Observable im Frontend
- **Interaktives Spiel**: Guess-the-Chart mit Joker-System und Leaderboard
- **Authentifizierung**: Token-basiert (UUID) mit BCrypt-Hashing
- **Watchlist**: Personalisierte Aktienüberwachung

### Besonderheiten der Guess-the-Chart-Funktion
- **Zufälliges Spieldesign**: Jedes Spiel hat unterschiedliche Aktien
- **4 Antwortmöglichkeiten**: 1 richtige, 3 falsche
- **Joker-System**: Einmaliger 50:50-Joker pro Spiel
- **Leaderboard**: Rangliste nach Score und Zeit
- **Chart-Visualisierung**: ngx-charts mit dynamischen Farben
- **Timer**: Zeitmessung für Scoring
- **Persistenz**: Scores werden in Datenbank gespeichert
