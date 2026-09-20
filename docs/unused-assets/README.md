# Unused assets

Assets kept for reference that the app does not use. They live here rather
than in `public/` because everything in `public/` is deployed and served at
the site root.

## Asset notes

### `viewport-frame.png`

**Status:** unused. Kept around for a possible second attempt.

Was tried as a decorative cockpit-style frame overlaid around the app to sell the "starship console" immersion. The result was a disaster — it fought every responsive layout, fought the existing scan-line / vignette / hex-panel chrome, and ate vertical space without adding clarity. Removed before it shipped.

If you revisit this: the frame needs to be a CSS-driven overlay that adapts to viewport size, not a fixed-aspect raster. The hex-panel + viewport-vignette CSS in `app/globals.css` already covers most of the immersion goal.
