---
name: preview-svg
description: Render and preview SVG animations in the browser with play/pause, timeline scrubbing, zoom & pan, code view, and export. Use when explaining a concept visually with an animated SVG (SMIL, CSS keyframes, or inline-JS), prototyping path-draw / morph / motion-path effects, or iterating on an animated icon, logo, or diagram. Triggers on "animated SVG", "explain visually", "SMIL", "path morph", "animateMotion", "animate this concept".
user-invocable: true
commands:
  - preview-svg
---

# Preview SVG Animation Skill

Render any animated SVG in a controllable browser preview — built for explaining
hard concepts visually. Supports SMIL (`<animate>`, `<animateTransform>`,
`<animateMotion>`), CSS keyframes/transitions inside `<style>`, and inline JS.

## Agent Usage

When the user asks to visualize or explain something with an animated SVG, write
the SVG content and pipe it to the script. The renderer parses the SVG, wires up
animation controls, and **automatically opens the result in the browser** — do
NOT open the file manually.

```bash
# Pipe SVG content
cat heartbeat.svg | ./run.sh

# Or from a file
./run.sh diagram.svg

# Skip browser, just emit path (useful for batch generation)
./run.sh diagram.svg --no-browser
```

## Usage

```bash
# Preview an SVG file
/preview-svg heartbeat.svg

# Pipe SVG content (preferred for temporary explainers)
cat animation.svg | /preview-svg
echo '<svg ...>...</svg>' | /preview-svg
```

## Built-in Controls

- **Play / Pause** — pauses all SMIL via `pauseAnimations()` and CSS via
  `animation-play-state`.
- **Restart** — `setCurrentTime(0)` for SMIL + reapplies CSS animations.
- **Timeline scrub** — drag the slider to seek; live updates while playing
  (SMIL only; CSS-only animations don't expose seeking).
- **Zoom & Pan** — mouse wheel to zoom (0.2x–20x), drag to pan via viewBox
  manipulation. Reset button restores original framing.
- **Code view** — toggle to inspect the source SVG.
- **Export SVG** — download the current SVG (preserves any runtime changes).

## When to Use

Activate when the user wants to:

- Explain a concept visually (gradient descent, request flow, data structures)
- Animate an icon or logo (path-draw, morph, hamburger↔X)
- Show motion along a path (`<animateMotion>` + `<mpath>`)
- Prototype loading spinners, progress rings, ambient backgrounds
- Build a self-contained, script-free interactive SVG (SMIL `begin="el.click"`)

For **interactive D3 / JS-driven** visualizations, prefer `preview-d3`. For
**3D / WebGL** scenes, use `preview-threejs`. For **flowcharts / sequence
diagrams**, use `preview-mermaid`.

## Authoring Guide

### Minimal animated SVG (SMIL)

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="10" fill="crimson">
    <animate attributeName="r" values="10;20;10" dur="1.2s" repeatCount="indefinite"/>
  </circle>
</svg>
```

### Path-draw (stroke-dashoffset)

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <style>
    .draw {
      stroke-dasharray: 200;
      stroke-dashoffset: 200;
      animation: draw 2s ease-in-out forwards;
    }
    @keyframes draw { to { stroke-dashoffset: 0; } }
  </style>
  <path class="draw" d="M10,50 Q50,10 90,50 T90,90"
        fill="none" stroke="#3b82f6" stroke-width="3"/>
</svg>
```

For accurate dasharray values, set `pathLength="100"` on the path and use
`stroke-dasharray="100"` — then dashoffset works in percent.

### Shape morph (SMIL `animate` on `d`)

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M10,10 L90,10 L90,90 L10,90 Z" fill="#3b82f6">
    <animate attributeName="d" dur="2s" repeatCount="indefinite"
             values="M10,10 L90,10 L90,90 L10,90 Z;
                     M50,10 L90,50 L50,90 L10,50 Z;
                     M10,10 L90,10 L90,90 L10,90 Z"/>
  </path>
</svg>
```

**Critical**: morph pairs must have **the same number of path commands of the
same types** — otherwise the browser cannot interpolate. Trace both shapes with
the same anchor count in the same winding direction.

### Motion along a path

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <path id="track" d="M20,100 Q60,20 100,100 T180,100" fill="none" stroke="#ddd"/>
  <circle r="6" fill="#3b82f6">
    <animateMotion dur="3s" repeatCount="indefinite" rotate="auto">
      <mpath href="#track"/>
    </animateMotion>
  </circle>
</svg>
```

`rotate="auto"` keeps the element tangent to the curve. Use `auto-reverse`
to flip 180°.

### Staggered entrance (delays)

Increment `begin` by ~0.3s per element for a smooth cascade:

```xml
<g opacity="0">
  <rect width="100" height="24" rx="12" fill="#4a4a6a"/>
  <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="0.3s" fill="freeze"/>
</g>
<g opacity="0">
  <rect width="100" height="24" rx="12" fill="#4a4a6a"/>
  <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="0.6s" fill="freeze"/>
</g>
```

`fill="freeze"` keeps the final state; without it, elements revert.

### Click-driven (no JS)

```xml
<rect id="box" width="40" height="40" fill="#3b82f6">
  <animate attributeName="fill" begin="box.click" dur="0.3s"
           to="#22c55e" fill="freeze"/>
</rect>
```

Chain animations with `begin="otherAnim.end + 0.2s"` for state machines.

## CSS vs SMIL — Choosing

| Goal                                 | Use  | Why                            |
| ------------------------------------ | ---- | ------------------------------ |
| `opacity`, color loops               | CSS  | GPU-accelerated, lower battery |
| `transform` (rotate/scale/translate) | CSS  | Composited on GPU              |
| `:hover` / `:focus` states           | CSS  | SMIL can't react to these      |
| Path morphing (`d` attribute)        | SMIL | CSS can't animate `d` portably |
| `viewBox` animation                  | SMIL | No CSS equivalent              |
| Click-triggered sequences            | SMIL | `begin="el.click"` without JS  |
| Following a bezier path              | SMIL | `<animateMotion>` + `<mpath>`  |

Default: **CSS for what it can reach, SMIL for the rest.**

## Layout & Composition — Avoid Overlap Bugs

The most common authoring failures aren't animation bugs — they're layout
collisions: an icon on top of text, a label that runs into the next column,
a decorative badge floating disconnected from its row. Follow these rules
to ship clean SVGs the first time.

### 1. Declare a grid before placing anything

At the top of the SVG (in a comment or in `<defs>`), declare your row Y
positions and column X positions as named coordinates. Place every element
via `<g transform="translate(X,Y)">` referencing those names. Never
free-position.

```xml
<!--
  Lanes:  CLIENT_X=160   SERVER_X=720
  Rows:   ROW1=60   ROW2=160   ROW3=260   ROW4=360
  Gaps:   row gap 100, gutter 24, icon-to-text 12
-->
<g transform="translate(160, 60)">
  <!-- ClientHello row content, anchored at (0,0) -->
</g>
```

### 2. Reserve horizontal space for icons

A 24×24 icon next to a text label needs **at least 12px gap** between them.
A 14px-font text label is roughly `chars × 7px` wide. Compute the icon's
position from the text's center, not from the row's center.

**Wrong**: icon `cx=400`, text centered at `x=400` → icon sits on top of text.
**Right**: text centered at `x=400`, icon at `cx = 400 - (charCount * 3.5) - 24`.

### 3. Don't put emojis inside `<text>`

Emoji rendering differs across OS/browser — sizing, baseline, and color
are unpredictable. They break alignment and animation timing. Use proper
SVG shapes for icons (paths, circles, gradients) or, if you must, give
the emoji its **own** `<text>` with explicit position so it doesn't shift
the surrounding label.

```xml
<!-- BAD: emoji shifts the rest of the text unpredictably -->
<text>shared session key 🔑</text>

<!-- OK: emoji is its own element with explicit position -->
<text x="100">shared session key</text>
<text x="280" font-size="18">🔑</text>

<!-- BEST: real SVG icon, fully controlled -->
<text x="100">shared session key</text>
<g transform="translate(280, -10)"><!-- key icon path --></g>
```

### 4. One element, one row

Decorations belong to one row only. Don't float a badge for row 2 next to
row 3's content — readers can't tell which row owns it. If a step needs
its own icon, build a self-contained `<g>` for that step with the icon
inside its bounds.

### 5. Leave breathing room at the edges

The renderer fills the stage at 100%; nothing crops to the viewport.
Inset content by **at least 5% of viewBox width** on each side so labels
don't kiss the edge.

### 6. Use a consistent text-anchor strategy per column

Pick one of:

- All labels in a column use `text-anchor="middle"` with `x` at the column center.
- All labels in a column use `text-anchor="start"` with `x` at the column left.

Mixing them within a column causes misalignment that compounds across rows.

### Authoring checklist

Before finalizing the SVG, mentally walk through:

- [ ] Every text and icon position is declared via a `<g transform>` or
      named coordinate (no magic numbers scattered through the file).
- [ ] No `<text>` contains an emoji adjacent to other characters.
- [ ] Every decoration is inside the `<g>` of the row it describes.
- [ ] All labels in the same column share one `text-anchor` strategy.
- [ ] Inset from viewBox edges is ≥ 5% on each side.
- [ ] No two elements with `fill` or `stroke` overlap unless intentionally
      layered (background → mid → foreground).

## Animation Theory — Quick Reference

- **Easing**: `ease-in` = slow start (anticipation), `ease-out` = soft landing
  (most natural for UI), `ease-in-out` for both ends, linear for continuous
  motion (spinners, loops).
- **Duration**: micro-interactions 150–300ms; UI transitions 300–500ms;
  storytelling animations 1–3s; ambient loops 3s+.
- **Stagger**: 50–100ms between items for lists, 200–400ms for heavy elements
  like cards or sections.
- **Reduced motion**: wrap non-essential motion in
  `@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`.
- **Don't animate**: layout properties (`width`, `height`, `top`, `left`) — use
  `transform` and `opacity`, the only two cheap properties.

## Stage Behavior

The preview stage:

- Resizes the SVG to `max-width: 90%; max-height: 90%` of the viewport
- Shows a checkerboard background so transparency is visible
- Strips `width`/`height` attrs on the root SVG and relies on `viewBox`
- Wraps fragments without an `<svg>` root in a default 400×400 SVG

## Stats Header

The header shows: `<lines> lines • <chars> chars • <features> • ~<duration>s`
where features is auto-detected from the content (`SMIL`, `CSS anim`, `JS`, or
`static`) and duration is estimated by parsing `dur` and `begin` attributes.

## Troubleshooting

### Animation doesn't play

- Confirm `<animate>` is **inside** the element it targets, not a sibling.
- For CSS, confirm `@keyframes name` matches `animation: name ...;`.
- Open devtools console — SMIL parse errors are silent in the DOM.

### Path morph jumps instead of tweening

- Source and target `d` paths must have the **same command sequence**. Convert
  both to a normalized form (e.g., all cubic beziers).

### Scrubber doesn't move

- Scrubbing requires SMIL (`setCurrentTime` is an SVG API). Pure CSS animations
  can be paused but not seeked.

### SVG is too small / too large

- Remove `width`/`height` attributes and rely on `viewBox`; the renderer strips
  them anyway so the stage controls sizing.

## Output

```
.preview-skills/svg/{filename}.html
```

## Learn More

- [SMIL 3.0 spec (W3C)](https://www.w3.org/TR/SMIL3/)
- [MDN: SVG animation with SMIL](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/SVG_animation_with_SMIL)
- [CSS-Tricks: SVG line animation guide](https://css-tricks.com/svg-line-animation-works/)
