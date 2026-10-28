#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Give a flat render on a studio card a real alpha channel.

Same rule as the clip pipeline (memory: 720-clip-background-removal): remove
ONLY the background, and find it by a FLOOD FILL seeded from the image border —
never by a global "everything light is background" test, which punches holes
through the subject's own light parts (eyes, teeth, highlights) because those
are enclosed by dark features and a border-seeded fill cannot reach them.

The card is not always white: these renders arrive on a soft grey (measured
218,219,219). The seed colour is therefore READ from the border, not assumed,
and the filled region is unpremultiplied against it so the contact shadow fades
out instead of being cut to a hard silhouette.

    python3 png_key_bg.py in.png out.png [--tol 26] [--feather 1]
"""
import sys
import numpy as np
from PIL import Image
from collections import deque


def key(src, dst, tol=26.0, feather=1):
    im = Image.open(src).convert("RGB")
    a = np.asarray(im).astype(np.float64)
    h, w, _ = a.shape

    # the card colour is whatever the border actually is
    border = np.concatenate([a[0, :], a[-1, :], a[:, 0], a[:, -1]])
    bg = np.median(border, axis=0)

    # the card is a noisy render, not a flat colour — threshold a slightly
    # blurred copy so grain does not stop the fill two pixels in (it left 22%
    # of the card opaque and speckled the first time)
    from PIL import ImageFilter
    sm = np.asarray(Image.fromarray(a.astype(np.uint8), "RGB")
                    .filter(ImageFilter.GaussianBlur(1.6))).astype(np.float64)
    near = (np.abs(sm - bg).max(axis=2) <= tol)

    # flood from every border pixel that is already near the card colour
    seen = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if near[y, x] and not seen[y, x]:
                seen[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if near[y, x] and not seen[y, x]:
                seen[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and near[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True; q.append((ny, nx))

    alpha = np.ones((h, w))
    # Unpremultiply the filled region against the card. A straight dist/tol ramp
    # leaves the render's GRAIN partly opaque (alpha ~0.35 everywhere), which
    # reads as speckle on any tinted surface — so everything within `core` of
    # the card goes fully transparent and only the band beyond it ramps, which
    # is where the contact shadow lives.
    core = 0.55 * tol
    dist = np.abs(sm - bg).max(axis=2)
    alpha[seen] = np.clip((dist[seen] - core) / max(tol - core, 1.0), 0.0, 1.0)

    if feather:
        from PIL import ImageFilter
        m = Image.fromarray((alpha * 255).astype(np.uint8), "L")
        alpha = np.asarray(m.filter(ImageFilter.GaussianBlur(feather))).astype(np.float64) / 255.0

    out = np.dstack([a, alpha * 255.0]).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(dst)
    print(f"{dst}: card={bg.astype(int).tolist()} transparent={100*seen.mean():.1f}%")


if __name__ == "__main__":
    args = [x for x in sys.argv[1:] if not x.startswith("--")]
    opt = {x.split("=")[0][2:]: float(x.split("=")[1]) for x in sys.argv[1:] if "=" in x and x.startswith("--")}
    key(args[0], args[1], tol=opt.get("tol", 26.0), feather=int(opt.get("feather", 1)))
