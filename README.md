<div align="center">
  <img src="public/favicon.svg" width="100" alt="Chessfish Logo">
  <h1>Chessfish</h1>
  <p>Professional Chess Analysis - Free & Open Source</p>
</div>

# Chessfish

A comprehensive chess analysis application featuring Stockfish engine integration, game storage, advanced analysis tools, and more. All features are accessible without any premium subscription.

## Features

### Core Gameplay
- **Play Mode**: Play against AI bots with adjustable difficulty (ELO 250-2500)
- **Analysis Mode**: Deep position analysis with Stockfish engine
- **Board Editor**: Custom position setup with piece placement and FEN export

### Advanced Analysis
- **Threats Visualization**: Highlight squares under attack by opponent pieces
- **Move Strength Indicators**: Color-code moves based on engine evaluation (green=good, red=bad)
- **Multi-PV Analysis**: View top 1, 3, or 5 candidate moves
- **Engine Settings**: Configure Hash (32-2048MB) and Threads (1-16) for local engine
- **Eval Bar**: Real-time evaluation display with percentage visualization

### Game Analysis & Reports
- **Game Review**: Automatic analysis of completed games
- **Blunder Detection**: Identify critical mistakes
- **Mistake Tracking**: Track suboptimal moves
- **Brilliant Moves**: Highlight exceptional moves
- **Avg CPL**: Average Centipawn Loss metric
- **AI Summary**: AI-powered game insights using Gemini

### Database & Storage
- **Supabase Integration**: Cloud game storage
- **FEN Search**: Find games by position
- **PGN Import/Export**: Standard chess notation support
- **Annotated PGN Export**: Export games with evaluation comments

### Openings Database
- **Lichess API Integration**: Real-time opening information
- **ECO Codes**: Standard opening classification
- **Opening Names**: Recognized opening names
- **Move Statistics**: Win/draw/loss percentages for openings

### Engine Options
- **Local WASM Engine**: Stockfish running in browser
- **Cloud Engine**: Server-side Stockfish analysis
- **NNUE Support**: Neural network evaluation (coming soon)

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Gemini API key (for AI game summaries)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Grinsefein/chessfish.git
cd chessfish
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```
GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Running the App

### Development Mode
```bash
npm run dev
```
The app will be available at `http://localhost:3000`

### Production Build
```bash
npm run build
npm run preview
```

### Server Mode (with Stockfish backend)
```bash
npm run dev
```
This starts both the Vite dev server and the Stockfish backend server.

## Usage

### Play Mode
1. Select a bot opponent from the dropdown
2. Click on a piece to see possible moves (highlighted squares)
3. Click on a highlighted square to make a move
4. The bot will respond automatically
5. Use UNDO to take back moves or RESIGN to end the game

### Analysis Mode
1. Load a position via PGN import or play moves
2. The engine automatically analyzes the current position
3. View top candidate moves in the analysis panel
4. Adjust depth, Multi-PV, and engine settings as needed
5. Toggle Threats to see attacked squares
6. Toggle Move Strength to see move quality indicators

### Board Editor
1. Click the Editor icon in the left navigation
2. Select a piece from the piece palette
3. Click on a square to place the piece
4. Right-click a square to remove a piece
5. Use Reset to restore initial position
6. Use Clear to remove all pieces
7. Copy FEN to copy the position notation

### Game Review
1. Complete a game or import a PGN
2. Click "Review Game" in the analysis panel
3. View accuracy, blunders, mistakes, and brilliant moves
4. Read AI-powered summary
5. Export annotated PGN with evaluations

## Project Structure

```
chessfish/
├── public/
│   └── favicon.svg          # App favicon
├── src/
│   ├── components/
│   │   ├── BoardEditor.tsx  # Board editor component
│   │   └── ui/              # UI components
│   ├── hooks/
│   │   ├── useChessGame.ts  # Chess game logic
│   │   ├── useStockfish.ts  # Stockfish engine integration
│   │   └── usePerformanceScaling.ts  # Dynamic difficulty
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client
│   │   └── utils.ts         # Utility functions
│   ├── services/
│   │   ├── gameStorage.ts   # Game CRUD operations
│   │   ├── openings.ts      # Opening database
│   │   └── geminiService.ts # AI summaries
│   ├── App.tsx              # Main application
│   └── main.tsx             # Entry point
├── server.ts                # Stockfish backend server
├── vite.config.ts           # Vite configuration
└── package.json             # Dependencies
```

## Technologies

- **Frontend**: React, TypeScript, Vite
- **Chess Logic**: chess.js
- **Chessboard**: react-chessboard
- **UI**: TailwindCSS, shadcn/ui, Lucide icons
- **Engine**: Stockfish (WASM & Node.js)
- **Backend**: Express, Socket.io
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API
- **Charts**: Recharts

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for game summaries | Optional |
| `VITE_SUPABASE_URL` | Supabase project URL | Optional |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Optional |

## Coming Soon

- NNUE support for enhanced engine evaluation
- Chess.com OAuth integration for game import
- Lichess OAuth integration for game import
- External engine configuration
- More opening databases and statistics
- Puzzles and training modes

## License

MIT License - feel free to use and modify as needed.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
