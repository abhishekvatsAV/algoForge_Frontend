# AlgoForge Frontend

AlgoForge Frontend is a React + Vite client for generating coding challenges, solving them in an interactive editor, and running/submitting solutions against the backend execution engine.

## Tech Stack

- React 19 + TypeScript
- Vite
- React Router
- Monaco Editor (`@monaco-editor/react`) for syntax highlighting and language intelligence
- FlexLayout (`flexlayout-react`) for IDE-like workspace layout
- Tailwind CSS (CDN-configured in `index.html`)

## Architecture Overview

```text
Browser
  -> App Router (`App.tsx`)
      -> Home (`pages/HomePage.tsx`)
      -> Playground (`pages/PlaygroundPage.tsx`)
      -> Admin (`pages/AdminPage.tsx`)

Playground
  -> Left pane: Problem statement + metadata
  -> Right top pane: Monaco code editor (JS/C++)
  -> Right bottom pane: Console (custom input, run output, submit result)

Data Layer
  -> `services/geminiService.ts`
      -> Authenticated REST calls to backend
      -> transforms backend DTO -> frontend `Problem` shape
```

## Key Features

- AI-generated DSA-style coding problems
- Monaco-based editor with syntax highlighting and autocomplete for JavaScript and C++
- IDE-like resizable panel layout (problem/editor/console)
- Keyboard shortcut for quick runs: `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (macOS)
- Dark/light theme support
- Auth-aware experience (guest mode fallback + token-based protected actions)

## Project Structure

```text
algoforge_frontend/
├── components/            # shared UI primitives
├── hooks/                 # auth/theme context hooks
├── pages/                 # route screens
├── services/              # API integration + mapping
├── constants.tsx          # templates + sample problem data
├── types.ts               # app/domain types
├── App.tsx                # route and shell composition
├── index.tsx              # app bootstrap
├── index.html             # Tailwind config + font setup
└── index.css              # global + layout styling
```

## Environment Variables

Create `.env.local` in `algoforge_frontend/`:

```env
GEMINI_API_KEY=your_key_here
BACKEND_URL=http://localhost:4000
```

> `BACKEND_URL` is required for run/submit/problem/auth APIs.

## Getting Started

```bash
npm install
npm run dev
```

The app runs on `http://localhost:3000`.

## Scripts

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run preview` - preview production build

## UI/UX Notes

- Playground layout is powered by `flexlayout-react`, so panels are draggable and reorganizable.
- Monaco editor is used to get closer to competitive coding platforms (syntax colors + suggestions).
- Console has dedicated `Run` and `Submit` views to separate local checks vs hidden-case evaluation.

## Backend Contract (Used by Frontend)

- `POST /user/signup`
- `POST /user/login`
- `GET /generate`
- `GET /problem/allproblems`
- `GET /problem/getlatestproblem`
- `GET /problem/getlatest3`
- `POST /run`
- `POST /submit`

All routes except `/user/*` and `/health` expect `Authorization: Bearer <token>`.
