# Banyan website

Static site (no build step), served by GitHub Pages from the root of `main`: https://shuyilinn.github.io/BanyanWeb/

## What lives where

The site is split over two repositories:

- **Here:** the pages (`*.html`), the styles, the drawing scripts (`replay.js`, `viz.js`, `page.js`) and the data files
  `data/*.js`. Pages, styles and scripts are edited here, by hand.
- **The boa3 repository (`demo/`):** `demo/build.py` generates `data/*.js` from stored runs and writes them into
  `data/` here; `demo/measure/` holds the timing scripts behind every page, and `experiments/demo_checks/` the
  measurement records. `build.py` stays there because it reads that repository's runs and code. Do not edit `data/`
  by hand; see `demo/README.md` there for the steps.

## Before committing

Run `python3 stamp.py` (versions the asset links so browsers pick up changed files). Preview locally with
`python3 -m http.server 8791 --bind 127.0.0.1`.
