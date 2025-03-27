# Roblox Trades Manager

A modern web application for managing Roblox trades, built with Next.js 14, React 18, and TypeScript.

## Features

- 🔄 Real-time trade management
- 🌓 Dark/Light theme support
- 📱 Responsive design
- 🔒 Secure API handling
- 📊 Trade status tracking

## Tech Stack

- **Framework**: Next.js 14.1.0
- **UI Library**: React 18.3.1
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Icons**: Lucide React
- **UI Components**: shadcn/ui
- **Date Handling**: date-fns
- **Form Validation**: Zod

## Project Structure

### Core Components

#### `/app`
- `layout.tsx` - Root layout with theme provider setup
- `page.tsx` - Main application page
- `/api/trades/route.ts` - Trade API endpoints with mock data
- `/store/trade-store.ts` - Zustand store for trade management
- `/types/trade.ts` - TypeScript interfaces for trade data

#### `/components`
- `/trades`
  - `trades.tsx` - Main trades component with tab navigation
  - `trade-list.tsx` - Renders list of trade cards
  - `trade-card.tsx` - Individual trade card component
- `/ui` - shadcn/ui components
- `header.tsx` - Application header with theme toggle
- `theme-provider.tsx` - Theme context provider

### Configuration Files

- `next.config.js` - Next.js configuration with SWC optimization
- `tailwind.config.ts` - Tailwind CSS configuration with custom theme
- `tsconfig.json` - TypeScript configuration
- `package.json` - Project dependencies and scripts

## Implementation Details

### Trade Management
- Trades are categorized as Inbound, Outbound, or Completed
- Each trade displays:
  - User information with avatar
  - Offering and requesting items
  - Trade status
  - Creation date
  - Action buttons for inbound trades

### State Management
- Zustand store manages:
  - Trade data
  - Loading states
  - Error handling

### API Integration
- RESTful endpoints for:
  - Fetching trades (`GET /api/trades`)
  - Updating trade status (`POST /api/trades`)

### UI/UX Features
- Responsive grid layout
- Status indicators with color coding
- Avatar integration with Roblox user thumbnails
- Smooth transitions and animations
- Dark/Light theme support

### Type Safety
- Comprehensive TypeScript interfaces
- Strict type checking
- Type-safe API responses

## File-by-File Documentation

### App Directory

#### `app/layout.tsx`
Root layout component that:
- Configures font (Inter)
- Sets up theme provider
- Handles toast notifications
- Manages HTML metadata

#### `app/page.tsx`
Main page component that:
- Renders header
- Contains trades component
- Handles page layout

#### `app/api/trades/route.ts`
API routes that:
- Provide mock trade data
- Handle trade actions
- Implement RESTful endpoints

#### `app/store/trade-store.ts`
Zustand store that:
- Manages global trade state
- Handles loading states
- Manages error states

#### `app/types/trade.ts`
Type definitions for:
- Trade interface
- Trade item interface
- Trade status types

### Components Directory

#### `components/header.tsx`
Header component with:
- Theme toggle
- Refresh button
- Settings button

#### `components/trades/trades.tsx`
Main trades component that:
- Implements tab navigation
- Handles trade filtering
- Manages data fetching

#### `components/trades/trade-list.tsx`
Trade list component that:
- Renders trade cards
- Handles empty states
- Implements responsive grid

#### `components/trades/trade-card.tsx`
Trade card component that:
- Displays trade details
- Shows user information
- Handles trade actions
- Formats dates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## License

MIT License