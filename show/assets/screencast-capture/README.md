# Screencast still capture

Headless-Chrome stills (1920x1080) of live pages for `[POST: SCREENCAST]` cues.
Edit the `targets` array, then:

```bash
cd show/assets/screencast-capture && npm i --no-save puppeteer-core@23
node capture.mjs out            # viewport + full-page per target
node capture2.mjs out           # framed: scroll to a text beat, hide chat/alert widgets
```

Uses `/usr/bin/google-chrome`. Ep2 set produced 2026-09-17 → `show/ep2/screencasts/`.
