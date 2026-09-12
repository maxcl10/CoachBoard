# Copilot Instructions — Avant Match

## What this is
A single static HTML page (`feuille_avant_match.html`) that displays a football
(soccer) team's pre-match sheet: opponent, date, formation, roster, and a
visual pitch diagram with players placed by position. There is no build
system, package manager, or test suite — it's plain HTML/CSS/JS meant to be
opened directly in a browser (or printed via the built-in print button).

## Running it
Open `feuille_avant_match.html` directly in a browser. There is no dev
server, build step, or linter configured for this repo.

## Data flow / architecture
- `loadConfig(config)` in the `<script>` block is the single entry point that
  renders everything: team names, match meta, the roster list, and the pitch
  spots. Any change to the config shape must be reflected there.
- The page ships with a `defaultConfig` object hard-coded in the script
  (currently mirroring `J1_alsasud-ejps.json`) that renders on load.
- Users can also load an external config via the file input (`#configFile`),
  which parses a JSON file with the same shape and calls `loadConfig` again.
- `J1_alsasud-ejps.json` is a sample/real match config: team names, venue,
  home/away flag (`domicile`), match type, date, formation, and `joueurs`
  (players) with `numero`, `nom`, `poste` (position code).
- `positionMap` translates a player's `poste` code (e.g. `GB`, `DCD`, `MOC`,
  `AC`) into `[x%, y%]` coordinates on the pitch. When two players share a
  poste, `loadConfig` auto-offsets their `y` coordinate so markers don't
  overlap — keep this logic in mind if adding new position codes.

## Conventions
- Content and UI labels are in French (field/position names like `GB`, `DG`,
  `DCD`, `MDC`, `AC`, etc. are French football position abbreviations —
  goalkeeper, left back, center back, defensive mid, striker, etc.).
- Config JSON files follow the `<matchday>_<opponent-slug>.json` naming
  pattern (e.g. `J1_alsasud-ejps.json` = "Journée 1 vs Alsasud").
- User-provided values (names, numbers) are rendered via `escapeHtml()` —
  keep using it for any new dynamic content to avoid HTML injection.
- `domicile: true/false` controls which team is shown on the left vs right
  in the match title (home team's own squad list is always what's in
  `joueurs`, regardless of home/away).
