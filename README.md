# Banyan website

Static site (no build step): open `index.html`, or serve the folder (`python3 -m http.server`). GitHub Pages serves it
from the root of `main`.

The pages' data (`data/*.js`) are generated from stored runs by `demo/build.py` in the boa3 repository; the
measurements behind them are recorded in boa3's `experiments/demo_checks/`. Do not edit `data/` by hand.
