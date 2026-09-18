# Screencast still capture

Headless-Chrome stills (1920x1080) of live pages for `[POST: SCREENCAST]` cues.
Edit the `targets` array, then:

```bash
cd show/assets/screencast-capture && npm i   # node_modules is gitignored
node capture.mjs out            # viewport + full-page per target
node capture2.mjs out           # framed: scroll to a text beat, hide chat/alert widgets
```

Uses `/usr/bin/google-chrome`. Ep2 set produced 2026-09-17 → `show/ep2/screencasts/`.

A target whose navigation hard-fails (`capture.mjs`) or whose `scrollText` beat is not on the page (`capture2.mjs`) is skipped with no PNG, and the run exits 1 after the remaining targets finish. A plain networkidle timeout is only a warning.
