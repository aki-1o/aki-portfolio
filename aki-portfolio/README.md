# Aki Portfolio

```
aki-portfolio/
├── .github/workflows/deploy.yml   builds client/ and publishes it to GitHub Pages
├── client/                        React + Vite site
│   └── src/
│       ├── data/        projects.js, services.js, site.js (landing copy lives here), changelog.seed.js
│       ├── pages/       Home, Projects, Changelog, ChangelogEdit, NotFound
│       ├── components/  Navbar, Footer, ProjectCard, GlassPanel, ...
│       └── lib/         api.js (talks to the server), semver.js
└── server/                        Express + MongoDB (changelog API, contact stub)
```

## Why two deployments

GitHub Pages only serves static files, so it can't run Node or hold a database. The split:

| Piece | Where | Cost |
|---|---|---|
| `client/` | GitHub Pages (via the included workflow) | free |
| `server/` | Render or Railway (any Node host) | free tier |
| Database | MongoDB Atlas (M0) | free |

SQLite was the other option, but it needs a persistent disk, which free Node hosts don't give you (data resets on redeploy). Atlas is a hosted database, so it survives everything.

## Run locally

```bash
cd server && cp .env.example .env   # fill in MONGODB_URI and ADMIN_KEY
npm install && npm run dev          # http://localhost:4000
cd client && npm install && npm run dev   # http://localhost:5173
```

## Deploy

1. **Atlas:** create a free M0 cluster, a database user, and allow network access (0.0.0.0/0 is fine for a portfolio). Copy the connection string.
2. **Server (Render):** new Web Service from this repo, root directory `server`, build `npm install`, start `npm start`. Environment variables: `MONGODB_URI`, `ADMIN_KEY` (long and random), `CLIENT_ORIGIN` (e.g. `https://<user>.github.io`; origins have no path).
3. **Client (GitHub Pages):** Settings → Pages → Source: GitHub Actions. Under Settings → Secrets and variables → Actions → Variables, add `VITE_API_URL` (your Render URL, no trailing slash) and, for a project site (`user.github.io/repo-name`), `VITE_BASE` = `/repo-name/`. Push to `main`.

The build copies `index.html` to `404.html`, so deep links like `/changelog` work on Pages.

## Changelog

- Public page: `/changelog`
- Editor: `/changelog/edit/by/aki` or `/changelog/edit/by/akshat`
- A new entry needs a **higher version** and a **later date** than the latest one (checked in the browser and again on the server). Also supports a type (feature/improvement/fix/design) and an optional link.
- **The URL is not the lock.** Anyone can guess it; what actually protects publishing is the `ADMIN_KEY`, which the server checks on every write (with a failed-attempt limiter). Keep it out of the repo.
- If the server is asleep (free tiers do that), the public page falls back to `changelog.seed.js`. Update that file occasionally if you want the fallback to stay current.

## Adding a project

Push an object onto `client/src/data/projects.js`. Exactly one should have `featured: true` (the homepage card).

## Easter eggs

| Trigger | What happens |
|---|---|
| Double-click the **Aki / Akshat** logo or the name on the landing page | A rainbow wipe and emojis float from the bottom of the screen to the top |
| Click the **rocker switch** | Toggles light / dark (the raised half with the red glow is the active theme) |
| **Double-click** the rocker switch (or press the backtick key) | Console mode: a full-screen terminal. Try `help`, `home`, `about`, `work`, `stack`, `changelog`, `contact`, `snake`, `coffee`. `exit` or Esc to leave |
| The near-invisible grid glyph at the bottom right of the landing intro, or typing `snake` anywhere | Opens `/snake` (commit.snake()) |
| **commit.snake()** | Click a square or press Space (or type `snake`) and the contribution graph lights up into a Snake board. Green dots = commits (+10). Every 5th commit a coffee cup appears: grab it for a 5s speed boost with 2x points. Score 100+ to unlock a glowing cursor trail for 5 minutes site-wide. Top 5 scores are kept in `localStorage` |
| The mug button in the bottom-left corner | **Coffee-to-Code** idle clicker. Click the mug for lines of code, spend them on Auto-Linter, Caffeinated Keyboard, Copilot and Rubber Duck. Progress (and up to an hour of offline earnings) is saved in `localStorage` |

Game logic lives in `client/src/lib/snake.js` (pure functions, no DOM) so it's easy to tweak: grid size, boost length and point values are constants at the top.

## 404 mini games

Any unknown URL (and a wrong `/changelog/edit/by/<name>`) shows the 404 page with **one of four games picked at random**. Force one with `?game=memory|invaders|cable|jump`, e.g. `/nope?game=invaders&wave=3` jumps straight to the boss.

| Game | How it works | Reward |
|---|---|---|
| **Memory Match: Missing Pages** | 4x3 grid of 3D-flip cards, 6 pairs of web-error icons (broken link, missing image, unplugged cable, crashed server rack, 404 cat, file not found) | Badge + a big "Take me home" button |
| **Error Invaders** | Canvas shooter: your ship follows the mouse/finger (or arrow keys) and fires automatically at descending 404/500/403 blocks. Every 3rd wave is a giant "404 Page Not Found" boss that breaks into mini errors at half health and again when destroyed | Score 250+ reveals a "Secret Warp Portal to Home" button |
| **Server Cable Reconnect** | Click tiles to rotate wires and connect the Browser node (left) to the Server node (right). Red dotted "404" tiles are dead wire. Puzzles are generated from a guaranteed solution, and a stopwatch counts up | "Server Connection Restored!", then auto-redirect home after 3s ("Stay here" cancels) |
| **HTTP Status Jump** | Canvas climber: `200 OK` solid, `301` slides side to side, `403` is fatal, `404` bounces you once then crumbles after 0.5s. Left/right wrap around the screen | Best height saved in `localStorage` |

Game logic for the cable puzzle and the jump physics lives in `client/src/lib/cable.js` and `client/src/lib/jump.js` (pure functions, no DOM).
