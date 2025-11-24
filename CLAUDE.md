# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

**YouTube Top is a video content idea generation tool** designed to help content creators discover trending topics and analyze successful video strategies. It combines YouTube trend analysis with AI-powered transcription to extract insights for video production planning.

## Project Overview

YouTube Top is a web application that provides YouTube video search based on view counts and speech-to-text extraction using Whisper AI. The project consists of a Next.js frontend (port 4000) and a FastAPI Python backend (port 15000).

## Content Creation Workflow

1. **Trend Discovery**: Search YouTube videos by view count and time period to identify trending content
2. **Category Analysis**: Filter by categories to understand niche-specific trends
3. **Script Extraction**: Use Whisper AI to extract scripts from successful videos
4. **Keyword Analysis**: Generate keyword clouds and trend data using Naver DataLab API
5. **Idea Generation**: Analyze patterns in successful content to develop new video ideas

## Common Development Commands

### Frontend (Next.js)
```bash
# Install dependencies
pnpm install

# Run development server (port 4000)
pnpm dev

# Build production
pnpm build

# Run linting
pnpm lint

# Run tests
pnpm test
```

### Backend (Python/FastAPI)
```bash
cd python-server

# Install dependencies using uv
uv sync

# Run development server (port 15000)
uv run uvicorn main:app --host 0.0.0.0 --port 15000 --reload

# Run Python linting
uv run black .
uv run isort .
uv run flake8
```

## Architecture & Key Components

### Frontend Structure
- **Next.js 14 with App Router** - Uses the new app directory structure
- **State Management**: Zustand stores in `src/store/`
  - `youtubeStore.ts` - YouTube API state and search functionality
  - `tabStore.ts` - UI tab state management
- **UI Components**: Material-UI (MUI) + Bootstrap 5
- **API Integration**: 
  - YouTube Data API v3 for video search
  - Backend API for transcription services

### Key Features for Content Creation
- **Trending Section** (`src/components/TrendingSection.tsx`): Displays top 20 videos by category
- **Search Form** (`src/components/SearchForm.tsx`): Advanced search with view count filtering
- **Keyword Cloud** (`src/components/KeywordCloud.tsx`): Visual keyword analysis using d3-cloud
- **AI Enhancement** (`src/components/AIEnhancementSection.tsx`): Keyword trend analysis
- **Transcription Form** (`src/components/TranscriptionForm.tsx`): Extract scripts from videos

### Backend Structure
- **FastAPI** server with CORS enabled for frontend
- **Whisper Integration**: Multiple model sizes (tiny to large)
- **yt-dlp**: YouTube audio extraction
- **Caching**: Automatic cache management for processed files
- **Naver DataLab API**: Keyword trend analysis (optional)

### Key API Endpoints
- Frontend serves on `http://localhost:4000`
- Backend API on `http://localhost:15000`
  - `/health` - Server status
  - `/models` - Available Whisper models
  - `/transcribe` - YouTube video transcription
  - `/keywords/*` - Naver DataLab integration

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here
GROK_API_KEY=your_grok_api_key_here
```

### Backend (Optional - for Naver API)
```
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret
```

## Development Workflow

1. **Both servers must run simultaneously**:
   - Terminal 1: `pnpm dev` (frontend)
   - Terminal 2: `cd python-server && uv run uvicorn main:app --host 0.0.0.0 --port 15000 --reload`

2. **TypeScript path aliases** are configured:
   - `@/` maps to `./src/`
   - `@/components/`, `@/app/`, `@/store/` for specific directories

3. **API Integration Pattern**:
   - Frontend utils in `src/utils/` handle API calls
   - Backend returns standardized JSON responses with `success` field

## Important Notes

- The project uses `pnpm` as the package manager, not npm or yarn
- Backend port is 15000, not the default 8000
- FFmpeg must be installed for audio processing
- Whisper models are downloaded on first use (can be large)
- jQuery is configured for legacy compatibility but prefer React patterns

## Development Best Practices

### When Adding New Features
1. **For trend analysis features**: Update `youtubeStore.ts` and create components in `src/components/`
2. **For AI/keyword features**: Ensure backend API endpoints are properly integrated
3. **For UI changes**: Follow existing Material-UI patterns and maintain Bootstrap grid system
4. **For transcription features**: Consider caching strategies to avoid re-processing videos

### Content Creator Focus
- Always consider the end goal: helping creators find video ideas
- Display data in actionable formats (trends, keywords, patterns)
- Prioritize performance for large result sets (virtualization for long lists)
- Maintain clear visual hierarchy for quick scanning of results

### API Rate Limits
- YouTube API has quotas - implement proper error handling
- Cache search results when possible
- Use pagination for large result sets
- Implement retry logic with exponential backoff

## LLM Integration for Content Ideas

### Recommended Prompt Templates for Video Script Analysis

1. **Script Structure Analysis**
   - Extract key themes and messages
   - Identify storytelling patterns
   - Analyze engagement techniques
   - Find emotional hooks
   - Understand information delivery methods

2. **Content Enhancement Prompts**
   - Improve opening hooks (first 15 seconds)
   - Increase viewer retention strategies
   - Suggest visual element additions
   - Expand target audience reach
   - Integrate trending keywords naturally

3. **Derivative Content Generation**
   - Generate 5+ new video ideas from successful scripts
   - Include titles, target audience, duration estimates
   - Identify unique selling points
   - Suggest thumbnail concepts

4. **Competitive Script Writing**
   - Strong hook development
   - Data-driven storytelling
   - Audience interaction points
   - Clear call-to-action placement
   - Optimal video length targeting

### Example LLM Integration Code Location
- Backend: `python-server/main.py` - Add LLM endpoints
- Frontend: `src/utils/aiEnhancement.ts` - LLM API integration
- Components: `src/components/AIEnhancementSection.tsx` - UI for LLM features