I am building a front-end-only prototype of a healthcare contract dashboard called Contract IQ. It has 3 levels:

1. Contract View: shows all contracts with KPIs like member months, expenses, surplus.
2. Provider View: shows performance by TIN, NPI, or Practice, with quality gap metrics.
3. PCP Panel View: shows top members by clinical risk flags (e.g., suspect conditions, polypharmacy, high utilizers), and includes a summary KPI overview section at the top.

There is no backend — data comes from local JSON files (e.g., kpis.json). The UI is built in HTML, JavaScript (with ES module syntax), and Tailwind CSS.

I will be pasting prompts to build individual components or sections step-by-step, and expect Cursor to generate accurate layout, card rendering, styling, and modular component code.

I want the styling to match the clean, professional layout from earlier Contract View UI (rounded cards, muted labels, clean typography, trend indicators, and spacing).

Trend indicators should use up/down arrows (▲ ▼) and color-coded styling (green/red) for MoM and YoY comparison.
