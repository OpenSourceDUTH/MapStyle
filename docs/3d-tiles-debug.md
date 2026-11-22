# 3D Tiles integration

The local RealityCapture export can be served by the MapStyle Vite server
directly from the generated output directory:

```text
/tiles/kav-10pct/tileset.json
```

Set `VITE_3D_TILES_LOCAL_DIR` to the directory containing `tileset.json` and
its relative GLB files. The repository's local export is at
`/mnt/Main/kav-10pct/tiles-work/output`. For a separate host, set
`VITE_3D_TILES_URL` to its absolute tileset URL; it is kept intact and is not
rewritten through the Martin proxy.

The integration is opt-in and is enabled with:

```sh
VITE_3D_TILES_URL=/tiles/kav-10pct/tileset.json \
VITE_3D_TILES_LOCAL_DIR=/mnt/Main/kav-10pct/tiles-work/output \
VITE_3D_TILES_ORIGIN_LON=24.3787057 \
VITE_3D_TILES_ORIGIN_LAT=40.9294296 \
npm run dev
```

The development server reads Vite environment variables at startup, so restart
it after changing `.env.local`.

For local development, keep the hosted Martin imagery/vector data behind the
Vite proxy and point the 3D tiles URL at the local model server, for example:

```env
VITE_MARTIN_URL=http://204.216.215.153:3000
VITE_TILES_URL=http://127.0.0.1:8080
VITE_3D_TILES_URL=http://127.0.0.1:8080/tileset.json
```

The app uses same-origin `/martin/...` requests for the hosted 2D/aerial data
in dev, so MapLibre workers do not need CORS access from the browser. A local
3D URL is left unchanged. Relative `/tiles/...` requests are served from
the configured local directory or forwarded through the `/tiles` proxy.

Then select the representation from the browser console:

```js
setRepresentation('photorealistic-3d')
```

The available IDs returned by `getRepresentations()` now include
`photorealistic-3d`. Returning to `aerial` removes the custom layer during the
normal MapLibre style rebuild.

The source mesh is local ENU metres relative to the configured origin: east is
source +X, north is source +Y, and up is source +Z. The tileset declares
`asset.gltfUpAxis = "z"` because the generated GLBs retain these axes.
The custom layer maps the local frame
to MapLibre X=east, Y=south, Z=up and applies the latitude-dependent
metres-to-Mercator scale. The tileset's own root transform is left untouched.
ECEF or an already georeferenced world-coordinate tileset must be recentered
into this local frame first.

The custom layer is inserted after `campus-aerial` and before the first symbol
layer. It uses `renderingMode: "3d"`, a shared WebGL context, `autoClear =
false`, `resetState()` before and after drawing, depth testing/writing from the
Three materials, and MapLibre repaint events from the renderer's
`needs-update`/model lifecycle events.
This makes the ordering invariant explicit: raster imagery is drawn first,
the mesh second, and labels/symbol overlays last.

Inspect a real tileset before enabling it:

```sh
npm run inspect:3d-tiles -- https://host/path/tileset.json
```

The inspector reports 3D Tiles version, extensions, root/child transforms,
bounding-volume types, geometric errors, refinement modes, and content URIs.
Its output is the evidence needed to decide whether the source data is ECEF,
WGS84, or a local frame and whether the 3D Tiles 1.1 warning corresponds to a
feature that the renderer does not support.

The source export originally reported one `ADD` root and 248 leaf tiles. Every
leaf had `geometricError: 0`, so it was a spatially tiled single-detail export,
not a multi-resolution LOD hierarchy. `scripts/build/3d-lod.mjs` creates a `lod1/`
companion for every tile with a 35% source-geometry target by default and
rewrites the tileset as 248 `REPLACE` branches: coarse content first, then the
original full-detail tile. When textured `.gltf` companions exist, the builder
uses them and carries `baseColor.jpg` into the LOD directory. Run it after
regenerating the source tiles:

```sh
npm run build:3d-lod -- /mnt/Main/kav-10pct/tiles-work/output lod1 0.35
```

The client keeps the coarse branch visible while full-detail children stream in.
The renderer's tile selection uses the hierarchy's geometric errors and camera
resolution, and the layer supplies the shared photogrammetry texture to legacy
GLBs that contain UVs but no material record.
