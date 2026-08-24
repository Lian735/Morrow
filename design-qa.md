# Morrow design QA

- Source visual truth: `/workspace/scratch/21d3f729cce1/upload/DE14BF90-CFA6-410E-91D9-B862CCFF0C81(1).jpeg`
- Source pixels: `1536 × 1024`, density-normalized as a desktop reference.
- Intended implementation viewport: `1440 × 1024` desktop, preview state `/?preview=1`.
- Implementation screenshot: unavailable.
- Browser preview: the supervised preview reports running, but the selected cloud browser returns `ERR_BLOCKED_BY_CLIENT` for the required preview address.

## Full-view comparison evidence

The source image was opened and inspected. A browser-rendered implementation screenshot could not be captured, so a valid combined comparison input could not be produced. Code, HTTP health, and build output are not being substituted for visual evidence.

## Focused-region comparison evidence

Blocked with the full-view capture. The player, contextual song menu, home hierarchy, typography, and responsive mobile state still require browser-rendered inspection.

## Static checks completed

- Production Vite build completes.
- Nine automated tests pass.
- Normal shell contains exactly one visible MiniPlayer; fullscreen Now Playing is hidden until opened.
- Track context menu is hidden by default and mounted only when a song overflow action is invoked.
- Native `<audio>` is the primary playback lifecycle; the YouTube iframe player is no longer used for playback.
- Media Session handlers cover play, pause, previous, next, seek, and stop.
- The fixed visual palette is neutral black, white, and gray; artwork supplies content color.

## Findings

- [P1] Browser-rendered visual fidelity is unverified.
  - Location: whole application.
  - Evidence: source is available, implementation capture is not.
  - Impact: typography, spacing, image crops, responsive reflow, and interaction placement cannot be passed from code alone.
  - Fix: open the required local preview in an accessible cloud-browser session, capture desktop and mobile states, then compare them with the source in one visual input.

- [P1] Primary interactions are not browser-verified.
  - Location: contextual song menu, queue drawer, fullscreen Now Playing, search, following, player controls.
  - Evidence: automated structural tests pass, but live click/focus/keyboard behavior could not be exercised in the cloud browser.
  - Impact: runtime interaction defects may remain despite valid syntax and tests.
  - Fix: exercise each interaction in the browser and inspect console errors before handoff.

## Required fidelity surfaces

- Fonts and typography: implemented with system UI text and Phosphor icons; browser rendering not verified.
- Spacing and layout rhythm: responsive CSS implemented for desktop, tablet, and mobile; rendered alignment not verified.
- Colors and visual tokens: neutral tokens confirmed statically; rendered contrast not verified.
- Image quality and asset fidelity: Morrow logo and runtime music artwork are used; live crops and remote image loading not verified.
- Copy and content: source hierarchy is represented with radio, public playlists, following, recommendations, one MiniPlayer, and contextual actions.

## Comparison history

- Pass 1: blocked before visual comparison because the running preview is unreachable from the selected cloud browser. No false visual pass recorded.

## Remaining checklist

1. Capture the implementation at `1440 × 1024` in preview state.
2. Test context menu open/close and keyboard focus.
3. Test fullscreen entry/exit and confirm the MiniPlayer is not visible beneath it.
4. Test queue, following, search, and mobile reflow.
5. Check console errors and compare source plus implementation together.

final result: blocked
