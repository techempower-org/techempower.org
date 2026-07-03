#!/usr/bin/env python3
# Build "Ep1 MASTER (logo intro)": sun logo + jingle for the pre-roll,
# then the edited episode ("Timeline 2") nested after it.
# Run INSIDE Resolve: Workspace -> Scripts -> Add_Ep1_Intro_Logo
import sys, os, traceback

# ---- config -----------------------------------------------------------
JINGLE_KEY = "warm-piano"  # any of: warm-piano bright-marimba hopeful-arp
#                                    acoustic-folk soft-fanfare uke-whistle
SOURCE_TIMELINE = "Timeline 2"
NEW_TIMELINE = "Ep1 MASTER (logo intro)"
LOGO = "/home/jp/Projects/techempower/show/assets/logo/techempower-sun.png"
JDIR = "/home/jp/Projects/techempower/show/assets/jingles"
FPS = 30
INTRO_FRAMES = 222  # 7.4 s @ 30 fps = longest jingle; logo holds under it
# -----------------------------------------------------------------------

LOG = "/tmp/ep1_intro_logo.log"
def log(m):
    try:
        with open(LOG, "a") as f: f.write(f"{m}\n")
    except Exception: pass
    print(m)
open(LOG, "w").close()

try:
    try:
        resolve
    except NameError:
        import DaVinciResolveScript as dvr; resolve = dvr.scriptapp("Resolve")
    if not resolve:
        log("FATAL: no Resolve handle"); sys.exit(2)
    pm = resolve.GetProjectManager(); proj = pm.GetCurrentProject()
    if not proj:
        log("FATAL: no current project"); sys.exit(3)
    mp = proj.GetMediaPool(); root = mp.GetRootFolder()

    def walk(f):
        out = list(f.GetClipList() or [])
        for s in (f.GetSubFolderList() or []): out += walk(s)
        return out

    clips = walk(root)
    def find(pred):
        return next((c for c in clips if pred(c)), None)

    jingle = find(lambda c: JINGLE_KEY in (c.GetName() or ""))
    logo = find(lambda c: "techempower-sun" in (c.GetName() or ""))
    src_tl = find(lambda c: (c.GetName() or "") == SOURCE_TIMELINE
                  and (c.GetClipProperty("Type") or "") == "Timeline")

    # import whatever's missing
    missing = []
    if not jingle: missing.append(os.path.join(JDIR, ""))
    if not logo: missing.append(LOGO)
    if missing:
        ms = resolve.GetMediaStorage()
        paths = ([os.path.join(JDIR, w) for w in sorted(os.listdir(JDIR))
                  if w.endswith(".wav")] if not jingle else []) + \
                ([LOGO] if not logo else [])
        added = ms.AddItemListToMediaPool(paths) or []
        log(f"imported {len(added)} media items")
        clips = walk(root)
        jingle = jingle or find(lambda c: JINGLE_KEY in (c.GetName() or ""))
        logo = logo or find(lambda c: "techempower-sun" in (c.GetName() or ""))

    log(f"jingle={jingle.GetName() if jingle else None} "
        f"logo={logo.GetName() if logo else None} "
        f"source-timeline={'FOUND' if src_tl else None}")
    if not (jingle and logo and src_tl):
        log("FATAL: missing jingle/logo/'Timeline 2' in the media pool "
            "(is the project the Ep1 one, and is the edit named exactly "
            f"'{SOURCE_TIMELINE}'?)"); sys.exit(4)

    tl = mp.CreateEmptyTimeline(NEW_TIMELINE)
    if not tl:
        log(f"FATAL: timeline '{NEW_TIMELINE}' already exists — delete or "
            "rename it and rerun"); sys.exit(5)
    proj.SetCurrentTimeline(tl)
    start = tl.GetStartFrame()

    placed = None
    try:
        placed = mp.AppendToTimeline([
            {"mediaPoolItem": logo, "startFrame": 0,
             "endFrame": INTRO_FRAMES - 1, "recordFrame": start,
             "trackIndex": 1, "mediaType": 1},
            {"mediaPoolItem": jingle, "recordFrame": start,
             "trackIndex": 1, "mediaType": 2},
        ])
        log(f"intro clipInfo append -> {placed}")
    except Exception as e:
        log(f"clipInfo append raised: {e!r}")
    if not placed:
        # fallback: plain sequential appends (logo gets default still length)
        placed = mp.AppendToTimeline([logo, jingle])
        log(f"fallback plain append -> {placed} "
            "(check A1/V1 alignment by hand)")

    nested = mp.AppendToTimeline([src_tl])
    log(f"nested episode append -> {nested}")
    if not nested:
        log("Nested-timeline append FAILED: drag 'Timeline 2' from the "
            "media pool onto the timeline after the intro by hand.")

    tl = proj.GetCurrentTimeline()
    v1 = tl.GetItemListInTrack("video", 1) or []
    a1 = tl.GetItemListInTrack("audio", 1) or []
    log(f"'{tl.GetName()}': V1={len(v1)} items, A1={len(a1)} items, "
        f"len={tl.GetEndFrame()-tl.GetStartFrame()} frames")
    resolve.OpenPage("edit")
    log("ALLDONE — review the jingle/logo overlap, then Deliver as usual.")
except Exception:
    log("UNCAUGHT EXCEPTION:"); log(traceback.format_exc()); sys.exit(9)
