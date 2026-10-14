# PP Mori

The type is set in **PP Mori** (Pangram Pangram). It is a licensed face, so
the files are deliberately not committed here.

Put these two files in this folder and everything picks them up with no code
change:

    PPMori-Regular.woff2     // weight 400 — Flood type, the page UI
    PPMori-SemiBold.woff2    // weight 600 — Stamp type

Until then every stack falls back to the system grotesque and the pieces
still run; they are just set in a different face.

Only these two weights are declared, on purpose. Asking for a weight the
family does not ship makes the browser synthesise a fake bold by smearing the
stems, which is very visible at Flood type's 2.2x peak. If you add more
weights, add a matching `@font-face` block in `app/globals.css`.

If you have the desktop `.otf` rather than web files, convert them — a woff2
is roughly half the size and is what the `src` above expects.
