# 💹 MHP Exchange

**MHP Exchange** is a full-stack virtual economy simulator developed by a team from **MHP**.  
It combines a **Spring Boot (Java)** backend with an **Angular** frontend to create an interactive trading experience.  
Players can buy and sell virtual assets, manage portfolios, and watch prices move in real time — optionally enhanced by **Raspberry Pi 5** hardware integration.

---

## 🚀 Tech Stack

**Frontend:** Angular, TypeScript, Chart.js, HTML, SCSS  
**Backend:** Spring Boot, Java 21, Spring Data JPA, WebSocket (STOMP), JWT Security  
**Database:** PostgreSQL (prod) / H2 (dev)  
**Hardware (optional):** Raspberry Pi 5 (GPIO buttons + LED for trade feedback)  
**Build & Deploy:** Maven, Docker, Docker Compose

---

## 🧠 Features

- 🔐 User registration & authentication (JWT)  
- 💰 Virtual assets market with dynamic price updates  
- 💸 Buy & sell trades with fees and slippage  
- 📊 Portfolio & trade history tracking  
- ⚡ Live market data via WebSocket  
- 🧱 RESTful API (Swagger documented)  
- 🥧 Raspberry Pi integration for physical buy/sell buttons and LED status  

---

## 🏗️ Architecture Overview

```text
Angular (Frontend)
     │
     │ REST / WebSocket
     ▼
Spring Boot (Backend)
     │
     │ JPA / Scheduled Tasks
     ▼
PostgreSQL / H2 Database
     │
     └── Optional: Raspberry Pi (Hardware Client)

