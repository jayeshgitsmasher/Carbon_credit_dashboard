# IKH MORIG carbon credit dashboard

Interactive estimate of carbon removal credits for the IKH MORIG biochar plant
(Khongor soum, Darkhan-Uul, Mongolia), built from `IKH_MORIG_VCS_PDD_Draft_v01.docx`
and the Verra VM0044 v1.2 approach.

## Run it

- **Simplest:** double-click `index.html` (or right-click it in VS Code → *Reveal in File Explorer* and open it).
- **In VS Code with live reload:** install the recommended *Live Server* extension,
  then right-click `index.html` → *Open with Live Server* (serves on http://127.0.0.1:5500).

No build step or install is needed. d3 is bundled in `vendor/`; fonts load from Google Fonts
when online and fall back to system fonts offline.

## How the credit is calculated

```
Net credits = M_soil × Corg × PF × 44/12 × (1 − project emissions) − leakage − buffer
            = 4,500 × 0.80 × 0.89 × 3.667 × 0.85  ≈ 9,986 tCO2e/yr (PDD: ~10,000)
```

## Files

| Path | What it is |
|---|---|
| `index.html` | Dashboard page |
| `css/styles.css` | Styles and light/dark theme tokens |
| `js/calc.js` | All carbon credit calculations (pure functions, `window.IKH_CALC`) |
| `js/app.js` | Charts, sliders and tables |
| `js/data.js` | Data bundle the page loads (generated) |
| `data/*.json` | Source data: PDD inputs, feedstock, benchmarks, deals, prices, ramp-up |
| `tools/build_data.py` | Rebuilds `js/data.js` after you edit `data/*.json` |

## Updating the numbers

1. Edit a file in `data/` (for example measured Corg in `pdd_inputs.json`).
2. Run `python tools/build_data.py`.
3. Reload the page.

## Assumptions to replace

- Corg 80%, permanence factor 0.89 and the 15% project-emission deduction are PFS assumptions, not measurements.
- Leakage and buffer default to 0% (TBD in the PDD).
- `data/ramp.json` is a sample ramp-up (25%, 60%, then 100%); the PDD has no commissioning dates yet.
- Benchmark removal factors come from Puro.earth audit statements, read as tCO2e per tonne of dry biochar.
