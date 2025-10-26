# Beispielrepo: GitHub Actions CI/CD für PR-Checks (Node.js)

Dieses Beispiel zeigt, wie ihr mit **GitHub Actions** Pull Requests automatisch lintet, testet, baut und (optional) Docker-Images erstellt. Ziel: Nur PRs mit "grünem" Status dürfen gemerged werden.

---

## Projektstruktur

```
.github/
  CODEOWNERS
  dependabot.yml
  pull_request_template.md
  workflows/
    ci.yml
    docker-build.yml
src/
  index.js
  sum.js
__tests__/
  sum.test.js
.eslintrc.json
.prettierrc
.gitignore
.dockerignore
Dockerfile
package.json
README.md
```

---

## README.md (Kurzfassung)

```md
# demo-gh-actions-ci

Kleines Node.js-Projekt zur Demo von GitHub Actions: Linting (ESLint), Tests (Jest), Build und optionaler Docker-Build. PRs müssen CI bestehen.

## Lokales Setup
```bash
nvm use 20 # optional
npm ci
npm run lint
npm test
npm start
```

## Branch-Schutz (für Maintainer)
1. Settings → Branches → Add rule → Branch name pattern: `main`
2. ✅ Require a pull request before merging
3. ✅ Require status checks to pass before merging → Häkchen bei `ci (Node x)` usw.
4. (Optional) ✅ Require conversation resolution
5. (Optional) ✅ Require linear history

## Konventionen
- PR-Template ausfüllen
- Reviewer laut CODEOWNERS
- Abhängigkeiten via Dependabot
```
```

---

## package.json

```json
{
  "name": "demo-gh-actions-ci",
  "version": "1.0.0",
  "type": "module",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "lint": "eslint .",
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js --coverage",
    "build": "echo 'Build step (z.B. tsc) – hier leer'"
  },
  "engines": { "node": ">=18" },
  "devDependencies": {
    "eslint": "^9.11.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-import": "^2.31.0",
    "jest": "^29.7.0",
    "prettier": "^3.3.3"
  }
}
```

---

## .eslintrc.json

```json
{
  "env": { "es2022": true, "node": true, "jest": true },
  "extends": ["eslint:recommended", "plugin:import/recommended", "prettier"],
  "parserOptions": { "ecmaVersion": 2022, "sourceType": "module" },
  "rules": {
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "import/no-unresolved": "off"
  }
}
```

---

## .prettierrc

```json
{ "singleQuote": true, "semi": true, "trailingComma": "es5" }
```

---

## .gitignore

```gitignore
node_modules
coverage
.DS_Store
.env
```

---

## .dockerignore

```dockerignore
node_modules
npm-debug.log
.git
coverage
```

---

## src/sum.js

```js
export function sum(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('sum(a, b) erwartet Zahlen');
  }
  return a + b;
}
```

---

## src/index.js

```js
import { sum } from './sum.js';

const result = sum(2, 40);
console.log(`2 + 40 = ${result}`);
```

---

## __tests__/sum.test.js

```js
import { sum } from '../src/sum.js';

describe('sum', () => {
  test('addiert zwei Zahlen', () => {
    expect(sum(2, 3)).toBe(5);
  });

  test('wirft bei falschen Typen', () => {
    expect(() => sum('2', 3)).toThrow(TypeError);
  });
});
```

---

## Dockerfile

```Dockerfile
# Minimaler Docker-Build zur Validierung im CI
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY . .
CMD ["node", "src/index.js"]
```

---

## .github/workflows/ci.yml

```yaml
name: ci

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-test:
    name: Node ${{ matrix.node-version }}
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        node-version: [18, 20]

    steps:
      - uses: actions/checkout@v4

      - name: Use Node ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test

      - name: Upload coverage
        if: success()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-${{ matrix.node-version }}
          path: coverage

  docker-validate:
    name: Docker build (validate)
    runs-on: ubuntu-latest
    needs: build-test
    steps:
      - uses: actions/checkout@v4
      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      - name: Build (no push)
        uses: docker/build-push-action@v6
        with:
          context: .
          platforms: linux/amd64
          push: false
```

---

## .github/workflows/docker-build.yml (optional für Releases)

```yaml
name: docker-release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  docker:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-qemu-action@v3
      - uses: docker/setup-buildx-action@v3
      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build & Push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository_owner }}/demo-gh-actions-ci:${{ github.ref_name }}
```

---

## .github/pull_request_template.md

```md
## Ziel
_Beschreibe kurz, was dieser PR tut._

## Checks
- [ ] CI grün
- [ ] Reviewer zugewiesen
- [ ] Breaking Changes dokumentiert

## Screenshots/Logs
_(optional)_
```

---

## .github/dependabot.yml

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
```

---

## CODEOWNERS

```text
# Automatisch Reviewer anfordern
* @your-org/your-team
```

---

## Schritt-für-Schritt: Repository einrichten

1. Neues Repo erstellen und Inhalte committen.
2. In **Settings → Actions → General** sicherstellen: Actions sind für die Organisation/Repo erlaubt.
3. In **Settings → Branches** Branch-Schutzregel für `main` anlegen (siehe README). Wählt die Checks aus `ci` und (optional) `docker-release` als **Required**.
4. (Optional) **Environments** anlegen (z. B. `prod`) und Secrets/Vars pflegen.
5. (Optional) **Packages** (GHCR) aktivieren, falls Docker-Push genutzt wird.

---

## Live-Demo-Ideen für die Präsentation

- **Fehlschlag zeigen**: Einen ESLint-Verstoß einbauen → PR wird rot.
- **Test-Fehler**: Einen Test absichtlich scheitern lassen → CI blockiert Merge.
- **Matrix**: Node 18 vs 20 in den Checks demonstrieren.
- **Artifacts**: Coverage als Download im Actions-Run zeigen.
- **Dependabot-PR**: PR öffnen lassen und durch CI prüfen lassen.
- **Branch Protection**: Versuch, direkt auf `main` zu pushen → wird abgelehnt.

---

## Erweiterungen (wenn ihr mehr zeigen wollt)

- **Coverage-Report kommentieren** (z. B. mit Codecov)
- **E2E-Tests** (Playwright) in separatem Job
- **Caches/Build-Zeiten optimieren** (Turbo, pnpm)
- **Monorepo** mit `paths`-Filter in `on:`
- **Reusable Workflows** mit `workflow_call`

---

Viel Erfolg bei der Präsentation! Du kannst dieses Dokument als Grundlage nehmen und direkt zu GitHub kopieren. Wenn du willst, kann ich dir auch eine kurze Folienvorlage (Key Points + Demos) erstellen.

