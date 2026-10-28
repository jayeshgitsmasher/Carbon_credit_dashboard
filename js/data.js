// Generated from the JSON files in /data. Edit those, then run: python tools/build_data.py
window.IKH_DATA = {
  "pdd_inputs": [
    {
      "key": "dry_feedstock",
      "parameter": "Dry feedstock input",
      "value": 22300,
      "unit": "t/yr",
      "basis": "PFS design, PDD §1.13"
    },
    {
      "key": "biochar_total",
      "parameter": "Biochar production",
      "value": 6000,
      "unit": "t/yr",
      "basis": "PFS design, PDD §1.13"
    },
    {
      "key": "biochar_soil",
      "parameter": "Soil-applied biochar (creditable)",
      "value": 4500,
      "unit": "t/yr",
      "basis": "75% of production, PDD §1.1"
    },
    {
      "key": "biochar_fuel",
      "parameter": "Fuel/industrial biochar (not credited)",
      "value": 1500,
      "unit": "t/yr",
      "basis": "25% of production, PDD §1.1"
    },
    {
      "key": "corg",
      "parameter": "Organic carbon content (Corg)",
      "value": 0.8,
      "unit": "fraction, dry",
      "basis": "PFS assumption, not yet measured, PDD §4.4"
    },
    {
      "key": "pf",
      "parameter": "Permanence fraction",
      "value": 0.89,
      "unit": "fraction",
      "basis": "PFS assumption, PDD §4.4"
    },
    {
      "key": "pe_share",
      "parameter": "Project-emission deduction",
      "value": 0.15,
      "unit": "share of gross",
      "basis": "PFS engineering assumption, PDD §4.2"
    },
    {
      "key": "pfs_net",
      "parameter": "PFS stated net removals",
      "value": 10000,
      "unit": "tCO2e/yr",
      "basis": "Rounded PFS figure, PDD §4.5"
    },
    {
      "key": "kilns",
      "parameter": "Yamasen kilns",
      "value": 20,
      "unit": "kilns",
      "basis": "PDD §1.1"
    },
    {
      "key": "jobs",
      "parameter": "Permanent jobs",
      "value": 27,
      "unit": "positions",
      "basis": "PDD §1.18"
    }
  ],
  "feedstock": [
    {
      "feedstock": "Livestock manure",
      "tonnes": 10500,
      "share": 0.47
    },
    {
      "feedstock": "Cereal straw",
      "tonnes": 8000,
      "share": 0.36
    },
    {
      "feedstock": "Wood and sawmill residue",
      "tonnes": 2200,
      "share": 0.1
    },
    {
      "feedstock": "Poultry litter and agro-processing waste",
      "tonnes": 1600,
      "share": 0.07
    }
  ],
  "benchmarks": [
    {
      "producer": "Carbon Cycle",
      "country": "Germany",
      "period": "2023-24",
      "factor": 2.916
    },
    {
      "producer": "Nuntorp Gård",
      "country": "Sweden",
      "period": "2023-24",
      "factor": 2.814
    },
    {
      "producer": "Groupe Bordet",
      "country": "France",
      "period": "",
      "factor": 2.659
    },
    {
      "producer": "ECOERA",
      "country": "Sweden",
      "period": "",
      "factor": 2.517
    },
    {
      "producer": "SC Explocom",
      "country": "Romania",
      "period": "",
      "factor": 2.504
    },
    {
      "producer": "Novocarbo",
      "country": "Germany",
      "period": "2023-24",
      "factor": 2.286
    },
    {
      "producer": "Sonnenerde",
      "country": "Austria",
      "period": "2020-21",
      "factor": 2.142
    }
  ],
  "deals": [
    {
      "deal": "Microsoft – Exomad Green",
      "supplier_country": "Bolivia",
      "volume_t": 1240000,
      "years": 10,
      "announced": "May 2025"
    },
    {
      "deal": "Supercritical – Exomad Green",
      "supplier_country": "Bolivia",
      "volume_t": 130000,
      "years": null,
      "announced": "2025"
    },
    {
      "deal": "Google – Varaha",
      "supplier_country": "India",
      "volume_t": 100000,
      "years": 5,
      "announced": "Jan 2025"
    }
  ],
  "prices": [
    {
      "key": "cdrfyi_avg",
      "benchmark": "CDR.fyi weighted average, biochar",
      "low": 136,
      "high": null,
      "currency": "USD",
      "as_of": "2026"
    },
    {
      "key": "puro_jun",
      "benchmark": "Puro.earth / Nasdaq CORCCHAR index",
      "low": 120.67,
      "high": null,
      "currency": "EUR",
      "as_of": "Jun 2026"
    },
    {
      "key": "puro_aug",
      "benchmark": "Puro.earth biochar index",
      "low": 135,
      "high": null,
      "currency": "EUR",
      "as_of": "Aug 2026"
    },
    {
      "key": "breakeven",
      "benchmark": "Supplier breakeven (CDR.fyi x OPIS)",
      "low": 143,
      "high": null,
      "currency": "USD",
      "as_of": "2025"
    },
    {
      "key": "artisanal",
      "benchmark": "Artisanal biochar range",
      "low": 100,
      "high": 150,
      "currency": "EUR",
      "as_of": "2026"
    },
    {
      "key": "global_south",
      "benchmark": "Global South industrial range",
      "low": 150,
      "high": 200,
      "currency": "EUR",
      "as_of": "2026"
    }
  ],
  "ramp": [
    {
      "year": 1,
      "utilisation": 0.25,
      "note": "Initial kiln tranche commissioned"
    },
    {
      "year": 2,
      "utilisation": 0.6,
      "note": "Build-out after performance check"
    },
    {
      "year": 3,
      "utilisation": 1
    },
    {
      "year": 4,
      "utilisation": 1
    },
    {
      "year": 5,
      "utilisation": 1
    },
    {
      "year": 6,
      "utilisation": 1
    },
    {
      "year": 7,
      "utilisation": 1
    },
    {
      "year": 8,
      "utilisation": 1
    },
    {
      "year": 9,
      "utilisation": 1
    },
    {
      "year": 10,
      "utilisation": 1
    }
  ]
};
