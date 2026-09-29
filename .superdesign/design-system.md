# KORA — Bidder-first Afrofuturist system

## Product and audience
KORA is a sealed-bid auction dApp for collectors and procurement teams. A bidder should feel calm and in control: they prepare a local encrypted bid, prove it meets the public auction rules, submit once, and later view only the public finalization receipt. A private bid must never be rendered in the UI after it is sealed.

## Direction: Afrofuturist systems design
Draw from future-facing civic infrastructure: warm mineral pigments, deep night surfaces, rhythmic modular geometry, and precise luminous signals. This is not sci-fi decoration. Avoid flags, costumes, masks, tribal patterns, generic "crypto" gradients, and stock neon. The interface feels like a trusted public exchange designed for a prosperous future.

## Color
- Ink: #0B1020; deep night canvas
- Basalt: #151C2E; elevated surface
- Grid: #26334B; structural border
- Sand: #F6F0E3; primary text
- Copper: #E06C47; primary action / attention
- Sun: #F0B85A; positive proof / progress
- Teal: #5BC8B2; verified / safe disclosure
- Red: #EF6A6A; errors only
Use flat color fields and soft radial illumination sparingly. Never use purple-blue gradients.

## Typography
Use Space Grotesk for display/labels and Inter for reading. Display type is tight, bold, and balanced; interfaces are clear, numeral-forward, and legible. Small labels use all caps with 0.12em tracking.

## Layout
Desktop uses a 12-column grid with a persistent left rail and a 640px proof-work area. Tablet collapses the rail into a compact top bar. Mobile is single-column with a bottom action dock. Use 8px spacing increments: 8, 12, 16, 24, 32, 48, 72.

## Components
- Surfaces: 16px radius, 1px #26334B border, subtle #000000 24% shadow; no glassmorphism.
- Primary buttons: copper background, ink text, 12px radius, visible teal focus ring.
- Status chips: colored 2px left rule plus icon and label.
- Data fields: monospaced numeric values, labels above values, never expose local secrets.
- Privacy boundary: a two-column protected/public ledger split by a vertical dotted evidence line.

## Motion and accessibility
Use Framer Motion for 180–280ms eased state transitions, proof-step progression, and a single quiet amber tracer. Respect `prefers-reduced-motion`, replacing movement with opacity. All controls have 3px teal focus rings, buttons meet contrast requirements, and errors state recovery actions plainly.

## Main screen
Auction workspace: left rail with KORA mark and network, top auction identity and close time, central four-step bidder journey (requirements, local bid, disclosure, prove), and a right-side public receipt/AI policy panel. Show proof privacy language in every decision point. The primary action is "Seal private bid" until wallet is connected, then "Generate proof". 
