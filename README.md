# X-Editor — PDF Editor Web App

3-panel PDF editor with hybrid fuzzy/phonetic search.

## Setup

```bash
pnpm install
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3001

## Environment

- `apps/web/.env`: `VITE_API_URL=http://localhost:3001`
- `apps/api/.env`: `PORT=3001`, `MAX_UPLOAD_MB=50`
