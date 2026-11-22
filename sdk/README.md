# GeoSpatial SDK workspace

This directory contains runtime behavior that is being prepared for extraction
into its own package.

- `interactions/` handles map events and selection dispatch.
- `selection/` owns selection state, animation, and floating markers.
- `selection-layers/` provides the interaction layers consumed by the style compiler.
- `cache/` contains tile caching behavior.
- `3d/` owns the 3D Tiles renderer integration and diagnostics.
- `representation-runtime.mjs` switches representations at runtime.

The `src/` tree remains the MapStyle style compiler and demo application. The
SDK currently imports style-layer definitions and shared icon assets from `src`
until it is extracted into a separate project.
 