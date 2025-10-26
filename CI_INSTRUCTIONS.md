# CI instructions

Dieses Repository zeigt ein einfaches Node.js Beispiel mit GitHub Actions:

- Workflow: `.github/workflows/ci.yml` — linting und Tests werden bei Push und Pull Requests auf `main` ausgeführt.
- Tests: `npm test` (Jest)
- Lint: `npm run lint` (ESLint, airbnb-base)

Lokal testen:

```powershell
npm install
npm run ci
```

Für die Präsentation kannst du Pull-Requests öffnen und zeigen, wie die Checks in GitHub automatisch laufen.
