# Avatar Manager

A React + Vite admin tool to view and update avatars via your NestJS API.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Environment

Edit `.env` to point to your API:

```
VITE_API_BASE_URL=https://your-heroku-app.herokuapp.com/api/v1
```

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/avatars/fetch-avatars` | Load all avatars (with optional filters) |
| GET | `/avatars/dashboard` | Load stats (nullCount, populatedCount) |
| GET | `/avatars/:id` | Load single avatar by ID |
| PATCH | `/avatars/:id` | Update avatar fields |
| POST | `/get-signed-url` | Get S3 pre-signed URLs for image upload |

## Image Upload Flow

1. User drops / selects an image file
2. App calls `POST /get-signed-url` → gets `{ urls[], keys[] }`
3. App PUTs the file directly to S3 via the signed URL
4. The returned `key` is saved into the `image` field via PATCH

## Project Structure

```
src/
  services/api.js      ← all HTTP calls
  pages/
    Dashboard.jsx      ← stats + avatar grid
    EditPage.jsx       ← load + edit + upload
  components/
    Navbar.jsx
    AvatarCard.jsx
    Toast.jsx
```
