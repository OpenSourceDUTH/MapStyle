# Temporary MapStyle deployment plan for GridHPC

The temporary map origin will run on `node002.gridhpc`. The manager
`mngmt01.gridhpc` provides internal DNS, runs Nginx Proxy Manager and handles
Cloudflare Tunnel ingress. This is the deployment reference for after the
[architecture review](../database/README.md#architecture-for-review-before-the-rebuild).
The examples use `maps.gridhpc` as the internal HTTP virtual host and port
3001 at the origin. Use the hostname assigned in GridHPC for the actual
tunnel.

```text
MapLibre / HTTP client
  → Cloudflare Tunnel
  → Nginx Proxy Manager on mngmt01.gridhpc
  → node002.gridhpc:3001 (Martin)
  → node002 local PostgreSQL (PostGIS)

QGIS / database maintenance → private SSH or VPN → PostgreSQL
```

## Prepare the origin

### Setup log — 20 November 2026

The operator ran these checks as `admin` on `login01` (`node002.gridhpc`).

```sh
sudo pg_lsclusters
sudo -u postgres psql -X -d postgres \
  -c "SELECT version();" \
  -c "SELECT name, default_version FROM pg_available_extensions WHERE name = 'postgis';" \
  -c "SHOW listen_addresses;"
```

Cluster `17/main` was online on port `5432`, owned by `postgres`, with data
in `/var/lib/postgresql/17/main`. PostgreSQL reported `17.12` (Debian
`17.12-0+deb13u1`) on x86-64. PostGIS `3.5.2` was available and
`listen_addresses` was `localhost`.

The operator then ran `curl postgis.gridhpc` and `curl localhost:5432` on
`login01`. The first returned OpenResty's HTTP 502 page. The second reached
the PostgreSQL port using HTTP and returned an empty reply. The pgAdmin
listener and the proxy's upstream address still need verification.

The operator confirmed that pgAdmin will run on `mngmt01` and connect to
PostgreSQL on `login01.gridhpc` (`192.168.1.145`). The login node needs a
LAN listener for this connection and a PostgreSQL authentication rule scoped
to the manager. The pgAdmin web route terminates on the manager. The LAN
listener and database login have yet to be verified.

On `mngmt01`, the operator ran `getent ahostsv4 login01.gridhpc`,
`ip route get 192.168.1.145`, and `getent ahostsv4 postgis.gridhpc`.
`login01.gridhpc` resolved to `192.168.1.145`. The route used `eno2` with
source `192.168.1.121`. `postgis.gridhpc` resolved to the manager at
`192.168.1.121`.

On `login01`, `sudo -u postgres psql -X -d postgres -c '\l maps' -c '\du'`
showed no `maps` database and only the `postgres` role. The operator
confirmed that pgAdmin had yet to be set up on `mngmt01`.

During database setup, `psql` reported `invalid integer value "postgis" for
connection option "port"` and kept the connection to `postgres`. Database
and role creation status still need verification before resuming.

The full transcript confirmed five successful `CREATE ROLE` statements for
`maps`, `maps_editor`, `mapstyle_owner`, `mapstyle_martin`, and
`mapstyle_editor`. The operator completed the `\password mapstyle_owner`
prompts. The next SQL statement was consumed as extra arguments to
`\password`. A subsequent `\l maps` returned zero rows, so setup resumes
with database creation. The owner password still needs a TCP login test.

The operator then verified a successful TCP login on `127.0.0.1` to
`maps` as `mapstyle_owner`. The query `SELECT current_database(),
current_user, postgis_version();` returned `maps`, `mapstyle_owner`, and
`3.5 USE_GEOS=1 USE_PROJ=1 USE_STATS=1`, confirming PostGIS is enabled.
Owner credential rotation is pending verification.

### Origin configuration

1. On `node002`, restore PostgreSQL and PostGIS using the
   [database bootstrap](../database/README.md). Use loopback for local
   consumers and the private LAN listener for pgAdmin on `mngmt01`. Use separate
   logins for Martin, maintenance and the API editor.
   Retain a logical backup of the application tables in storage outside
   `node002`.
2. Use a Martin build with COG, MLT and resources. The local check used
   `ghcr.io/maplibre/martin:2.0.0-beta.7` and PostGIS 3.7. The standard
   x86_64 Martin image needs an x86-64-v3 CPU. Check `node002` first and
   select the matching legacy CPU build if required. [Martin installation](https://maplibre.org/martin/installation/)
3. Set `MAPSTYLE_DATA_DIR` to a persistent directory and supply the
   read-only Martin `DATABASE_URL` through service configuration. Run as
   a dedicated service account. Set `MARTIN_LISTEN_ADDRESS` to the node's
   private address on port 3001 so Nginx Proxy Manager can connect, and
   restrict that port to the manager. The configuration defaults to
   127.0.0.1:3001 for local use. Run `martin --config martin.yaml`.

## Prepare styles and assets

Build on a workstation or in CI and copy the assets to the directories below.
The map color, collision, zoom and layer ordering rules live in MapStyle.
PostGIS supplies classification, rank, geometry and stable IDs.

| Origin path | Asset |
| --- | --- |
| `$MAPSTYLE_DATA_DIR/styles/map-style.json` | Style compiled for the router serving it. |
| `$MAPSTYLE_DATA_DIR/sprites/` | SVG inputs produced by `npm run build:sprites -- "$MAPSTYLE_DATA_DIR/sprites"`. Martin creates its own 1× and 2× atlases from these files. |
| `$MAPSTYLE_DATA_DIR/fonts/` | DejaVu Sans regular and bold TTFs for the configured fallback aliases. |
| `$MAPSTYLE_DATA_DIR/imagery/result.martin.allzoom.cog.tif` | Recovered campus raster. Preserve the original filename and source ID. |
| A static HTTP origin on `node002` | Full `kav-10pct` 3D Tiles directory if the photorealistic mode is enabled. Preserve its hierarchy and configure the existing `VITE_3D_TILES_URL` and tile proxy. Martin serves the COG and vector tiles. |

For direct use through the tunnel, compile using its external HTTPS origin.

```sh
MAPSTYLE_MARTIN_URL="$TUNNEL_MAP_ORIGIN" npm run build:style -- dist/map-style.json 2d
npm run build:sprites -- "$MAPSTYLE_DATA_DIR/sprites"
```

For the Maps API gateway, compile a 2D style with `MAPSTYLE_MARTIN_URL=''` to
use root-relative Martin paths. The gateway rewrites these to
`/api/v1/maps/...` and requires a token with the `maps` feature. Set
`MAP_TILES_URL` to the private proxied Martin origin. If the Go API serves
an aerial or satellite style, its external ArcGIS source needs an explicit
gateway mapping. The admin editor connects to PostgreSQL using
`PLACES_DATABASE_URL` and the editor login.

## Route and verify

1. On `mngmt01`, verify that the Nginx Proxy Manager container resolves
   `node002.gridhpc` using the manager's internal DNS and can request
   `http://node002.gridhpc:3001/health`. Configure the `maps.gridhpc` proxy
   host to forward to that destination.
2. Map the Cloudflare Tunnel's HTTPS hostname to Nginx Proxy Manager. If
   the proxy host only knows the internal name, set the tunnel origin
   HTTP Host Header to `maps.gridhpc`. Preserve vector tile negotiation by
   forwarding `Accept` and avoiding a cache key that would serve MVT and
   MLT interchangeably. [Cloudflare Tunnel origin parameters](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/configure-tunnels/origin-parameters/)
3. Compare the origin and tunnel responses for `/health`, `/catalog`,
   `/style/map-style`, `/sprite/sprites@2x.json`,
   `/font/Noto%20Sans%20Regular/768-1023`,
   `/places/16/37206/24588` and
   `/result.martin.allzoom.cog/16/37206/24588`. Request Places once with
   `Accept: application/x-protobuf` and once with
   `Accept: application/vnd.maplibre-tile`. The catalog should list 22
   PostGIS sources and the campus raster. Raw OSM and private Places views
   should be absent.
4. For QGIS, forward a local port to `node002` PostgreSQL over the approved
   SSH route. From a reachable GridHPC network, use
   `ssh -J mngmt01.gridhpc -N -L 15432:127.0.0.1:5432 node002.gridhpc`
   or connect directly to the login node if available. Use a read-only
   database login and point QGIS at `127.0.0.1:15432`. The HTTP proxy and
   public map tunnel are for tiles and map assets.

After an OSM or Places change, invalidate the applicable Martin and proxy
caches before verifying the new data. Check that the served client style
uses the tunnel hostname and that QGIS reads the same database. Switch
client URLs after validating the tunnel hostname. These are owner-run
deployment steps. The validation record covers the disposable local stack.
