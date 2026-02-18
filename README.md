# Sensor Dashboard

A mobile-first application for viewing IoT sensor and gateway telemetry data. Built with React Native (Expo), Express.js, and InfluxDB.

## Architecture

React Native (Expo)  →  Express.js API  →  InfluxDB
    (mobile app)          (port 5000)       (port 8086)

## Prerequisites

Before starting, make sure you have the following installed:

| Tool | Minimum Version | Check Command |
|------|----------------|---------------|
| Node.js | v18+ | `node -v` |
| npm | v9+ | `npm -v` |
| Git | any | `git --version` |
| InfluxDB 2.x | v2.0+ | `influxd version` |
| Expo Go app | latest | Install from App Store / Play Store on your phone |

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/sensor-dashboard.git
cd sensor-dashboard
```

### 2. Set Up InfluxDB

#### Install (Fedora)

```bash
cat <<EOF | sudo tee /etc/yum.repos.d/influxdata.repo
[influxdata]
name = InfluxData Repository - Stable
baseurl = https://repos.influxdata.com/stable/\$basearch/main
enabled = 1
gpgcheck = 0
gpgkey = https://repos.influxdata.com/influxdata-archive_compat.key
EOF

sudo dnf install influxdb2 -y
```

#### Install (Ubuntu/Debian)

```bash
curl -s https://repos.influxdata.com/influxdata-archive_compat.key | sudo apt-key add -
echo "deb https://repos.influxdata.com/debian stable main" | sudo tee /etc/apt/sources.list.d/influxdata.list
sudo apt update
sudo apt install influxdb2 -y
```

#### Install (macOS)

```bash
brew install influxdb
```

#### Start InfluxDB

```bash
# Linux
sudo systemctl start influxdb
sudo systemctl enable influxdb

# macOS
brew services start influxdb
```

#### Configure InfluxDB

1. Open `http://localhost:8086` in your browser
2. Complete the setup with these values:

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | your choice |
| Organization | `e4a` |
| Bucket | `sensor_data` |

3. **Copy the generated API token and save it.** You will need it in the next step.

#### Verify

```bash
curl http://localhost:8086/health
```

Expected response:

```json
{"name":"influxdb","message":"ready for queries and writes","status":"pass"}
```

### 3. Set Up the Backend

```bash
cd backend
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Edit `.env` and paste your InfluxDB token:

```env
INFLUX_URL=http://localhost:8086
INFLUX_TOKEN=paste_your_token_here
INFLUX_ORG=e4a
INFLUX_BUCKET=sensor_data
PORT=5000
```

Import the sample sensor data into InfluxDB:

```bash
node scripts/import-data.js
```

Expected output:

```
Processing gateways/ (3 files)
──────────────────────────────────────────────────
GTW-100.json         → 50 points written
GTW-200.json         → 50 points written
GTW-400.json         → 50 points written

Processing sensors/ (8 files)
──────────────────────────────────────────────────
AT-105.json          → 50 points written
BMS-100.json         → 50 points written
CLS-100.json         → 50 points written
HSS-100.json         → 50 points written
TP-102.json          → 50 points written
TP-400R8.json        → 50 points written
TP-400V.json         → 50 points written
WGR-100.json         → 50 points written

Import complete!
Files processed: 11
Total points:    550
```

Start the API server:

```bash
node src/app.js
```

#### Verify the Backend

Open a new terminal and test:

```bash
# Health check
curl http://localhost:5000/api/health

# List all devices
curl http://localhost:5000/api/devices | python3 -m json.tool
```

### 4. Set Up the Mobile App

```bash
cd mobile
npm install
```

Find your machine's local IP:

```bash
hostname -I | awk '{print $1}'
```

Edit `services/api.ts` and replace `YOUR_LOCAL_IP` with your actual IP:

```typescript
const API_BASE_URL = 'http://192.168.1.XXX:5000/api';
```

Start the Expo development server:

```bash
npx expo start
```

#### View on Your Phone

1. Make sure your phone and your machine are on the **same WiFi network**
2. Open the **Expo Go** app on your phone
3. Scan the QR code shown in the terminal
4. The app should load and display the list of devices

## Running the Full Stack

You need **three things running simultaneously**:

```bash
# Terminal 1 — InfluxDB (if not running as a service)
sudo systemctl start influxdb

# Terminal 2 — Backend API
cd backend
node src/app.js

# Terminal 3 — Mobile App
cd mobile
npx expo start
```

## Testing the API

| Endpoint | Command |
|----------|---------|
| Health check | `curl http://localhost:5000/api/health` |
| List all devices | `curl http://localhost:5000/api/devices` |
| Single device | `curl http://localhost:5000/api/devices/DEVICE_MAC_HERE` |
| Device fields | `curl http://localhost:5000/api/devices/DEVICE_MAC_HERE/fields` |
| Historical data | `curl "http://localhost:5000/api/devices/DEVICE_MAC_HERE/history?field=temperature_chip"` |

Replace `DEVICE_MAC_HERE` with an actual MAC address from the devices list (e.g., `F8-55-48-2C-23-EB`).

## Troubleshooting

### App shows "Cannot reach the server"

- Verify the backend is running: `curl http://localhost:5000/api/health`
- Verify your phone and PC are on the same WiFi network
- Verify the IP in `services/api.ts` matches your machine's current IP (`hostname -I`)
- Check that the backend is listening on `0.0.0.0` not just `localhost`

### InfluxDB connection error

- Verify InfluxDB is running: `sudo systemctl status influxdb`
- Verify the health endpoint: `curl http://localhost:8086/health`
- Verify your token in `.env` matches the one from the InfluxDB UI

### Import script shows 0 points

- Check that the JSON files exist in `backend/data/gateways/` and `backend/data/sensors/`
- Check that the file names match exactly (case-sensitive on Linux)

### Chart shows no data

- Try a different metric from the dropdown — not all fields have numeric data
- Check the browser console at `http://localhost:8086` (Data Explorer) to verify data exists in InfluxDB

### Expo Go can't connect

- Make sure you're not on a corporate/guest WiFi that blocks local traffic
- Try running `npx expo start --tunnel` as an alternative connection method

## Project Structure

```
sensor-dashboard/
├── backend/
│   ├── src/
│   │   ├── app.js                 # Express server entry point
│   │   ├── config/influx.js       # InfluxDB connection
│   │   ├── routes/devices.js      # API route handlers
│   │   └── services/influx.service.js  # Database query logic
│   ├── scripts/import-data.js     # Data import utility
│   ├── data/                      # Sample sensor data (JSON)
│   ├── .env.example               # Environment variable template
│   └── package.json
│
├── mobile/
│   ├── app/                       # Screens
│   │   ├── index.tsx              # Device list (home)
│   │   └── device/[mac].tsx       # Device detail
│   ├── components/                # UI components
│   │   ├── device-info.tsx        # Device identity card
│   │   ├── readings-card.tsx      # Current readings display
│   │   └── history-chart.tsx      # Chart with metric selector
│   ├── services/                  # API client and formatters
│   ├── types/                     # TypeScript interfaces
│   └── package.json
│
└── README.md
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native (Expo) |
| Backend | Express.js |
| Database | InfluxDB 2.x |
| Charts | react-native-chart-kit |
| Language | TypeScript / JavaScript |
```
