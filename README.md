# 🏔️ HimClimX - Himalayas Climate Explorer

Advanced climate analytics dashboard for the Himalayan region with AI-powered insights, comprehensive trend analysis, and interactive visualizations.

## Features

- **📊 Time Series Analysis** - Visualize climate data over time with trend overlays
- **📈 Trend Analysis** - Linear regression with statistical significance testing
- **🚨 Anomaly Detection** - Identify statistical anomalies using Z-score method
- **🔮 AI Forecasting** - Prophet-based time series forecasting
- **🌍 Climate Scenarios** - SSP scenario projections for 2050
- **⚠️ Impact Assessment** - Risk evaluation and adaptation recommendations
- **📄 Report Generation** - Downloadable analysis reports

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Data Fetching:** TanStack Query
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/himclimx-dashboard.git
cd himclimx-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your API URL:
```
NEXT_PUBLIC_API_URL=https://web-production-2d8b0.up.railway.app
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Select Variable** - Choose a climate variable (temperature, precipitation, etc.)
2. **Choose Region** - Pick a Himalayan region and elevation zone
3. **Set Time Period** - Select the analysis time range
4. **Enable Analysis Options** - Toggle desired analyses
5. **Run Analysis** - Click the button to fetch and analyze data

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Set environment variables
4. Deploy

### Manual Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx
├── components/
│   ├── analysis/
│   │   ├── AnalysisTabs.tsx
│   │   ├── Charts.tsx
│   │   ├── StatCards.tsx
│   │   └── WelcomeScreen.tsx
│   ├── layout/
│   │   └── Sidebar.tsx
│   └── ui/
│       └── index.tsx
├── hooks/
├── lib/
│   ├── api.ts
│   ├── constants.ts
│   ├── store.ts
│   └── utils.ts
└── types/
    └── index.ts
```

## API Endpoints

The dashboard connects to a Flask backend with the following endpoints:

- `/api/data/timeseries` - Time series data
- `/api/data/climatology` - Monthly climatology
- `/api/analysis/trend` - Trend analysis
- `/api/analysis/anomalies` - Anomaly detection
- `/api/analysis/statistics` - Statistical summary
- `/api/forecast/prophet` - Time series forecast
- `/api/forecast/scenarios` - Climate scenarios
- `/api/impact/assess` - Impact assessment

## License

MIT License

## Acknowledgments

- Applied Data Science Lab, Centre For Quantitative Economics and Data Science
- Birla Institute of Technology, Mesra
- Himalayan Climate Research Initiative
