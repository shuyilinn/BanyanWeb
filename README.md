# Banyan website

Static site (no build step), served by GitHub Pages from the root of `main`: https://shuyilinn.github.io/BanyanWeb/

The pages, styles and scripts live only here; edit them here. Before committing, run `python3 stamp.py` (versions the
asset links so browsers pick up changed files). Preview locally with `python3 -m http.server 8791 --bind 127.0.0.1`.

`data/*.js` are generated from stored runs by `demo/build.py` in the boa3 repository (it writes into `data/` here); the
timing scripts are `demo/measure/` there and the measurement records `experiments/demo_checks/`. Do not edit `data/` by hand.
