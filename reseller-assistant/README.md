# ResellerPricr - Visual AI Pricing Assistant

An AI-powered mobile web application that helps resellers identify products and research prices by simply taking a photo. Built for thrift store flippers, estate sale hunters, and vintage collectors.

## Features

- **Photo-based identification**: Snap a photo, get instant product analysis
- **Real sold data**: Pulls actual eBay sold listings (not just asking prices)
- **ROI calculation**: Automatic fee and shipping calculation for profit analysis
- **Scan history**: Track all scanned items with CSV export for business records
- **Mobile-optimized**: Designed for on-the-go use at thrift stores and garage sales

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Mobile Web UI  │────▶│  FastAPI Backend│────▶│  Claude API     │
│  (React + Vite) │◀────│  (Python)       │◀────│  (Vision AI)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  eBay API       │
                        │  (Sold Data)    │
                        └─────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Anthropic API key
- eBay API credentials (optional, mock data used otherwise)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd reseller-assistant
   ```

2. **Set up environment variables**
   ```bash
   # Backend .env
   cp backend/.env.example backend/.env
   # Edit with your API keys
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running with Docker

```bash
docker-compose up --build
```

### Running separately

**Backend:**
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` in your browser.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API info |
| `/api/scan/` | POST | Upload image for analysis |
| `/api/scan/health` | GET | Health check |
| `/api/health` | GET | Global health check |
| `/docs` | - | Swagger UI (auto-generated) |

## Project Structure

```
reseller-assistant/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI application
│   │   ├── routes/
│   │   │   └── scan.py       # Scan endpoint
│   │   ├── services/
│   │   │   ├── vision.py     # Claude AI integration
│   │   │   ├── ebay.py       # eBay API wrapper
│   │   │   └── fees.py       # Fee calculations
│   │   └── models/
│   │       └── schemas.py    # Pydantic models
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CameraCapture.tsx
│   │   │   ├── ResultsCard.tsx
│   │   │   ├── ScanHistory.tsx
│   │   │   └── Header.tsx
│   │   ├── hooks/
│   │   │   └── useScan.ts
│   │   ├── lib/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
└── docker-compose.yml
```

## Fee Calculations

### eBay (default)
- Percentage: 12.9%
- Fixed: $0.30 per order
- Shipping: Category-based estimate

### Poshmark
- Percentage: 20% flat
- Fixed: $0

### Mercari
- Percentage: 10%
- Fixed: $0

## Rate Limiting

Free tier: 10 scans per day (IP-based)

## CSV Export

History can be exported with columns:
- Date
- Item Name
- Brand
- Category
- Estimated Value

## Development

### Backend Development

```bash
cd backend
python -m uvicorn app.main:app --reload
```

### Frontend Development

```bash
cd frontend
npm run dev
```

## Future Enhancements

- [ ] Multi-platform support (Poshmark, Mercari APIs)
- [ ] User authentication
- [ ] Cloud storage for scan history
- [ ] Barcode/QR code scanning
- [ ] Batch photo upload
- [ ] Profit/loss tracking over time
- [ ] Integration with accounting software

## License

MIT
