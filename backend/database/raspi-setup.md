# Raspberry Pi Datenbank & Backend – Dokumentation

## 1. Systemüberblick
- **Backend**: Spring Boot Anwendung (`mvn spring-boot:run`), das Prod-Profil nutzt eine MariaDB auf dem Raspberry Pi.
- **Raspberry Pi**: Host `simon@192.168.0.192`, MariaDB 10.11.14 lauscht auf Port 3306 (`0.0.0.0:3306`).
- **Datenbank**: Schema `mhp_exchange`, wichtigste Tabelle `users` (Login/Profil). App-User `mgx_app` (Passwort `SehrSicheresPasswort123!`).

## 2. Voraussetzungen
1. Raspberry Pi erreichbar (Ping/SSH), MariaDB-Dienst aktiv:
   ```bash
   ssh simon@192.168.0.192
   sudo systemctl status mariadb
   sudo ss -ltnp | grep 3306    # Erwartet: LISTEN 0.0.0.0:3306
   ```
2. Backend-Repo auf dem Mac vorhanden: `~/Documents/DHBW/3.Semester/Prog/webdev/MHP-Global-Exchange-MGX-`.

## 3. Datenbank-Setup
### 3.1 App-User & Passwort
Im MariaDB-Client (`sudo mariadb` oder `mariadb -u root -p`):
```sql
CREATE DATABASE IF NOT EXISTS mhp_exchange CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'mgx_app'@'%' IDENTIFIED BY 'SehrSicheresPasswort123!';
GRANT ALL PRIVILEGES ON mhp_exchange.* TO 'mgx_app'@'%';
FLUSH PRIVILEGES;
```
### 3.2 Schema einspielen
Auf dem Host (Mac):
```bash
cd ~/Documents/DHBW/3.Semester/Prog/webdev/MHP-Global-Exchange-MGX-
mariadb -h 192.168.0.192 -P 3306 -u mgx_app -p < backend/database/schema-logindata.sql
```
`schema-logindata.sql` legt Datenbank + `users`-Tabelle an.

## 4. Backend-Konfiguration
`backend/src/main/resources/application-prod.properties`:
```properties
spring.datasource.url=jdbc:mariadb://192.168.0.192:3306/mhp_exchange
spring.datasource.username=mgx_app
spring.datasource.password=SehrSicheresPasswort123!
spring.jpa.hibernate.ddl-auto=update
```
Prod-Profil nutzt damit direkt die Pi-Datenbank.

## 5. Anwendung starten (Prod)
```bash
cd ~/Documents/DHBW/3.Semester/Prog/webdev/MHP-Global-Exchange-MGX-/backend
SPRING_PROFILES_ACTIVE=prod ./mvnw spring-boot:run
# Alternative: ./mvnw spring-boot:run -Dspring-boot.run.profiles=prod
```
Logausgabe prüfen:
- `The following 1 profile is active: "prod"`
- `HikariPool-1 - Added connection conn0: url=jdbc:mariadb://192.168.0.192:3306/mhp_exchange`

## 6. Testablauf
1. **Registrierung**
   ```bash
   curl -X POST http://localhost:8080/api/auth/register \
        -H 'Content-Type: application/json' \
        -d '{"email":"tester@example.com","password":"Passwort123!","name":"Tester"}'
   ```
   Erwartet: `success:true`, Token.

2. **Login**
   ```bash
   curl -X POST http://localhost:8080/api/auth/login \
        -H 'Content-Type: application/json' \
        -d '{"email":"tester@example.com","password":"Passwort123!"}'
   ```
   Erwartet: `success:true`, neues Token.

3. **Token prüfen (optional)**
   ```bash
   curl -H "Authorization: <token>" http://localhost:8080/api/auth/validate
   ```

4. **Datenbank verifizieren**
   ```sql
   mariadb -u mgx_app -p mhp_exchange
   SELECT id, email, balance FROM users;
   ```
   `balance` default 10000.0, `watchlist` leer.

5. **Aufräumen** (optional)
   ```sql
   DELETE FROM users WHERE email='tester@example.com';
   ```

## 7. Fehlerbehebung
- **`No route to host` / Timeout**: Netzwerk prüfen (`ping 192.168.0.192`), Firewall (`sudo ufw allow 3306/tcp`), `bind-address=0.0.0.0`.
- **`Access denied`**: Grants/Passwort prüfen, `ALTER USER 'mgx_app'@'%' IDENTIFIED BY 'NeuesPasswort';`.
- **`Caused by: java.net.SocketException: Connection refused`**: MariaDB-Dienst läuft nicht (`sudo systemctl restart mariadb`).
- **Noch H2 im Log**: falsches Profil (sicherstellen `SPRING_PROFILES_ACTIVE=prod`).

## 8. Sicherheit & Betrieb
- Root-Remotezugang deaktivieren:
  ```sql
  DELETE FROM mysql.user WHERE User='root' AND Host='%';
  FLUSH PRIVILEGES;
  ```
- Passwörter/API-Keys langfristig in Env-Variablen oder Secrets-Store auslagern (nicht im Git).
- Für Produktion: TLS zwischen Backend und DB (`?useSSL=true`) und Migrationen via Flyway/Liquibase statt `ddl-auto=update`.
- Kurzer Porttest vom Mac ohne Zusatztools:
  ```bash
  python3 - <<'PY'
  import socket
  try:
      with socket.create_connection(("192.168.0.192", 3306), timeout=5):
          print("Port 3306 erreichbar")
  except OSError as exc:
      print(f"Verbindung fehlgeschlagen: {exc}")
  PY
  ```

## 9. Wartung
- Anwendung stoppen: `Strg+C`.
- MariaDB Backups: `mysqldump -u mgx_app -p mhp_exchange > backup.sql`.
- Updates einspielen: `sudo apt update && sudo apt upgrade`, anschließend DB/Backend neu starten.

## 10. Kontaktpunkte
- Datei-Referenzen:
  - `backend/database/schema-logindata.sql`
  - `backend/src/main/resources/application-prod.properties`
  - `backend/src/main/java/com/mhp/exchange/user/api/AuthController.java`, `User.java`
- Zugangsdaten: siehe Abschnitt 3/4 (bei Passwortänderungen anpassen).
