# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MHP Global Exchange (MGX) is a full-stack stock market application with a Spring Boot backend and Angular frontend. The application provides real-time stock price data and historical chart visualization.

## Architecture

### Backend (Spring Boot 3.3.0)
- **Location**: `backend/`
- **Main Application**: `com.mhp.exchange.MhpExchangeApplication`
- **Package Structure**:
  - `market/api`: REST controllers and API DTOs
  - `market/domain`: Domain models
  - `config`: Configuration classes (CORS, etc.)
  - `trading/`: Feature stub (not yet implemented)
  - `portfolio/`: Feature stub (not yet implemented)

### Frontend (Angular 20.3)
- **Location**: `frontend/angular/`
- **Routing**: Standalone component-based routing
- **Pages**:
  - `pages/home`: Main dashboard with real-time stock prices (SSE streaming) and chart visualization
  - `pages/markets`: Markets page (stub)
- **Key Technologies**:
  - `@swimlane/ngx-charts` for charting
  - `lightweight-charts` for advanced visualizations
  - Server-Sent Events (SSE) for real-time updates

### API Integration
- **Finnhub API**: Real-time stock quotes via `/api/market/prices` endpoint
- **Twelve Data API**: Historical price data via `/api/market/candles/{symbol}` endpoint
- **CORS**: Configured to allow `http://localhost:4200` (Angular dev server)

### Data Flow
1. Backend uses Spring WebFlux `WebClient` for non-blocking API calls to external market data providers
2. `/api/market/prices` endpoint streams data using SSE (Server-Sent Events) with reactive `Flux`
3. Frontend `MarketService` connects via EventSource for real-time price updates
4. Chart data is fetched on-demand when user selects a stock

## Development Commands

### Backend
```bash
# From backend/ directory
mvn spring-boot:run              # Run backend server (default port 8080)
mvn clean install                # Build project
mvn test                         # Run tests
mvn clean package                # Create JAR file
```

### Frontend
```bash
# From frontend/angular/ directory
npm install                      # Install dependencies
ng serve                         # Run dev server (http://localhost:4200)
ng build                         # Build for production
ng test                          # Run Karma unit tests
ng generate component name       # Generate new component
```

### Full Stack Development
1. Start backend: `cd backend && mvn spring-boot:run`
2. Start frontend: `cd frontend/angular && ng serve`
3. Access application at `http://localhost:4200`

## Configuration

### API Keys
API keys are stored in `backend/src/main/resources/application.properties`:
- `finnhub.api.key`: For real-time quotes
- `twelvedata.api.key`: For historical data

**Important**: These keys should be moved to environment variables or a secure configuration management system before deployment.

### CORS Configuration
The backend CORS configuration in `config/WebConfig.java` currently allows all origins from `http://localhost:4200`. Update this for production deployments.

## Key Implementation Details

### Reactive Streaming with Rate Limiting
The `/api/market/prices` endpoint uses `Flux.delayElements(Duration.ofSeconds(2))` to prevent hitting API rate limits when fetching multiple stock symbols.

### Error Handling
- Backend uses `.onErrorResume()` to gracefully handle individual API failures without breaking the entire stream
- Frontend handles SSE errors by reconnecting automatically via EventSource

### Chart Color Logic
Chart colors in the frontend dynamically change based on performance:
- Green (`#26a69a`): Price increased over the period
- Red (`#ef5350`): Price decreased over the period

## Angular Routing
The application uses standalone components with route definitions in `app.routes.ts`. Routes are not lazy-loaded currently.

## Testing
- Backend: Standard JUnit tests (none currently implemented)
- Frontend: Jasmine/Karma unit tests with spec files alongside components
