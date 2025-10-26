# WireGuard VPN – Zugriff auf den Raspberry Pi

## 1. Überblick
- **Server**: Raspberry Pi mit WireGuard-Serverdienst, IPv6-Endpunkt `2a02:8070:48a:b180::aa61`, UDP-Port `51820`.
- **Zweck**: Sicherer Fernzugriff auf das Pi-LAN (`192.168.0.0/24`) sowie das WireGuard-Tunnelnetz (`10.8.0.0/24`).
- **Server-Keys** liegen unter `/home/simon/`.

## 2. Server-Schlüssel (nur zur Dokumentation)
```bash
ls -l ~/wg-server.key ~/wg-server.pub
# -rw-r--r-- 1 simon simon 45 Oct 26 12:07 /home/simon/wg-server.key
# -rw-r--r-- 1 simon simon 45 Oct 26 12:07 /home/simon/wg-server.pub

cat ~/wg-server.key      # Private Key (nicht weitergeben!)
# 8FU4o0FCgIzb3Us42HrAu773RIIp88AUu3ShjCbFpWk=

cat ~/wg-server.pub      # Public Key
# /4I+l3FDgrS+Aya2vF5DprcUFOL4DzSbZeVUFRi0IWc=
```

> **Hinweis:** Der private Schlüssel (`wg-server.key`) bleibt ausschließlich auf dem Server. Zugriffe absichern (Dateirechte 600, Besitzer `simon`).

## 3. Client-Konfiguration (WireGuard)
Auf dem Client (z. B. macOS oder iOS) eine neue Tunnel-Konfiguration anlegen:

```
[Interface]
PrivateKey = ONBPWRu1aZ3av2YJolU3vtLEcAeXRLCRiM8i3rF6yms=
Address = 10.8.0.2/32
DNS = 10.8.0.1           # optional

[Peer]
PublicKey = /4I+l3FDgrS+Aya2vF5DprcUFOL4DzSbZeVUFRi0IWc=
AllowedIPs = 10.8.0.0/24, 192.168.0.0/24
Endpoint = [2a02:8070:48a:b180::aa61]:51820
PersistentKeepalive = 25
```

- `PrivateKey`: Client-Schlüssel, sicher verwahren. Bei Bedarf mit `wg genkey` neu erzeugen.
- `AllowedIPs`: Route sowohl Tunnelnetz als auch Heimnetz durch das VPN.
- `PersistentKeepalive`: Verhindert Idle-Disconnects hinter NAT/Firewall.

## 4. Pi-Seite konfigurieren
Auf dem Raspberry Pi die Peer-Konfiguration ergänzen (`/etc/wireguard/wg0.conf`):

```
[Peer]
PublicKey = ONBPWRu1aZ3av2YJolU3vtLEcAeXRLCRiM8i3rF6yms=
AllowedIPs = 10.8.0.2/32
```

> Danach WireGuard neu laden: `sudo wg syncconf wg0 <(wg-quick strip wg0)` oder `sudo systemctl restart wg-quick@wg0`.

## 5. Verbindung testen
1. Tunnel auf dem Client aktivieren.
2. `ping 10.8.0.1` (Pi-WireGuard-IP) und `ping 192.168.0.192` (MariaDB).
3. Datenbankverbindung prüfen: `mariadb -h 192.168.0.192 -P 3306 -u mgx_app -p`.

## 6. Sicherheit
- Private Keys niemals per Mail/Messenger senden, stattdessen sichere Kanäle nutzen.
- Regelmäßig `sudo wg show` prüfen, ob unerwartete Peers verbunden sind.
- Firewall (`ufw`/`iptables`) so konfigurieren, dass `51820/udp` von außen erreichbar ist, andere Ports bleiben geschlossen.
- Bei Verlust eines Client-Geräts sofort `wg-quick strip wg0` prüfen und den entsprechenden Peer entfernen.
