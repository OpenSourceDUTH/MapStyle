# Map database tables

Schema proposal for review, with the existing import and API tables identified separately. IDs such as `B1` stand for UUIDs. Example campus data, heights and API values are illustrative unless identified as recovered. A `?` suffix marks a nullable field. `geom` is horizontal EPSG:4326 unless specified. Heights and dimensions are in metres.

## 1. OSM imports and permanent map features

### OSM data and the local schema

| Layer | What it stores |
| --- | --- |
| OSM editing database | The Rails PostgreSQL schema has current and historical elements, tag tables, ordered way nodes, relation members and changesets. [OSM Wiki database schemas](https://wiki.openstreetmap.org/wiki/Databases_and_data_access_APIs#Database_Schemas) · [Upstream SQL schema](https://github.com/openstreetmap/openstreetmap-website/blob/master/db/structure.sql) |
| OSM download | A `.osm.pbf` snapshot encodes nodes with coordinates, ways with ordered node IDs, and relations with ordered, typed members and roles. OSM XML and JSON are other encodings. OsmChange is a format for applying changes. [OSM file formats](https://wiki.openstreetmap.org/wiki/OSM_file_formats) · [PBF message definitions](https://github.com/openstreetmap/OSM-binary/blob/master/osmpbf/osmformat.proto) |
| MapStyle import | osm2pgsql Flex writes selected geometries and tags to three PostGIS tables for QGIS and the basemap. The Lua mapping defines this output. Way-node lists, relation member lists and element versions remain in the archived source where present. [Flex manual](https://osm2pgsql.org/doc/manual.html#flex-output) · [Local mapping](../database/kavala.lua) · [Recovered PostgreSQL DDL](../database/recovered-schema.sql) |

An OSM element is identified by its type and positive ID. Node `41001` and way `41001` are separate elements. An area is interpreted from a closed way or a relation. Flex uses the sign of `area_id` to encode which one produced an area. The archived Kavala relation `2346651` includes typed members with roles such as `admin_centre` and `outer`. Its imported polygon is keyed by `area_id=-2346651`. Project references use `(relation, 2346651)`. [OSM elements](https://wiki.openstreetmap.org/wiki/Elements) · [osm2pgsql ID handling](https://osm2pgsql.org/doc/manual.html#id-handling) · [Local recovery evidence](../database/RECOVERY.md)

### Existing MapStyle import and boundary tables

| Table | Columns | Keys and rules | Example entry |
| --- | --- | --- | --- |
| `public.osm_points` | `node_id bigint`, `tags? jsonb`, `geom geometry(Point,4326)` | The bootstrap adds a unique index on `node_id`. The reconstructed Lua mapping emits tagged nodes. | `41001`, `{"highway":"bus_stop","name":"Campus"}`, `POINT(24.38 40.93)` |
| `public.osm_lines` | `way_id bigint`, `tags? jsonb`, `geom geometry(LineString,4326)` | The bootstrap adds a unique index on `way_id`. Lua emits tagged open ways and tagged closed ways with `area=no` here. | `51001`, `{"highway":"secondary","lanes":"2","width":"7","sidewalk":"both"}`, centreline |
| `public.osm_polygons` | `area_id bigint`, `tags? jsonb`, `geom geometry(Geometry,4326)` | The bootstrap adds a unique index on `area_id`. Lua attempts polygons for tagged closed ways unless `area=no`, and multipolygons for `type=multipolygon` or `type=boundary` relations. The SQL geometry type is generic. | `61001`, university footprint. `-2346651`, Kavala boundary. |
| `public.osm2pgsql_properties` | `property text`, `value text` | PK `property`. Importer metadata. | `updatable`, `false` |
| `map.kavala_boundary_source` | `area_id bigint`, `name text`, `name_el? text`, `name_en? text`, `admin_level? text`, `tags jsonb`, `geom geometry(MultiPolygon,4326)` | PK `area_id`. Saved fallback boundary. | `-2346651`, Δήμος Καβάλας, `admin_level=7` |
| `map.coastline_derived` | `id bigint`, `geom geometry(Geometry,4326)` | PK `id`. Bootstrap checks for LineString or MultiLineString. Persistent coastline seed. | `1`, recovered joined coastline |
| `basemap.ocean` | `id bigint`, `class? text`, `geom geometry(Geometry,4326)` | PK `id`. Bootstrap checks for Polygon or MultiPolygon. Persistent sea polygon. | `1`, `sea`, recovered polygon |

The reconstructed Lua filters by tags and assembles geometries. Its closed-way branch is a project rule. OSM also uses closed ways for linear features such as roundabouts. Inspect way semantics before expanding that rule for new features. [OSM elements](https://wiki.openstreetmap.org/wiki/Elements) · [Local mapping](../database/kavala.lua) · [Local bootstrap](../database/bootstrap.sql)

The archived PBF contains 105,823 nodes, 12,025 ways and 502 relations. The validated local import produced 3,528 point, 7,117 line and 4,886 area rows. These are counts at different stages of processing. The archive has no history and its newest element timestamp is 2026-09-18 18:30:37 UTC. [Local recovery evidence](../database/RECOVERY.md)

### Refresh and proposed permanent tables

The current job downloads a regional PBF or accepts a prepared extract, runs `osmium extract --strategy smart` when downloading, then imports with `osm2pgsql --create --slim --drop` in a staging schema. It promotes rows and refreshes derived layers in one SQL transaction. This is a full rebuild of the working extract. Applying `.osc` or `.osc.gz` incrementally would require a separate design that retains osm2pgsql's update state and manages replication. [OSM Wiki database schemas](https://wiki.openstreetmap.org/wiki/Databases_and_data_access_APIs#Database_Schemas) · [osm2pgsql update modes](https://osm2pgsql.org/doc/manual.html#basic-command-line-operation) · [Local refresh script](../scripts/database/update-osm.mjs) · [Promotion SQL](../database/refresh-basemap.sql)

| Table | Columns | Keys and rules | Example entry |
| --- | --- | --- | --- |
| `map.osm_import` | `id uuid`, `source_url text`, `source_at? timestamptz`, `extract_geom geometry`, `pbf_asset_id? uuid`, `extract_sha256 text`, `imported_at timestamptz`, `published_at? timestamptz` | PK `id`. Asset FK to `media.asset`. Hash the exact extract supplied to the importer. Record upstream snapshot time when available. | `I1`, Greece PBF from `2026-11-19T21:22:20Z`, Kavala extract asset `A_PBF` |
| `map.feature` | `id uuid`, `origin text`, `osm_type? text`, `osm_id? bigint`, `authored_geom? geometry`, `authored_tags jsonb`, `created_at timestamptz` | PK `id`. OSM records have a unique `(osm_type, osm_id)` using positive IDs. Custom features own geometry. A custom Place can get its XY from an explicit anchor point or a linked indoor feature. Assign a UUID to a feature when it needs a durable reference or edit. | `B1` → OSM way `61001`. `R210` → custom office polygon with `{"ref":"210"}`. |
| `map.feature_edit` | `feature_id uuid`, `geom_override? geometry`, `set_tags jsonb`, `remove_tags text[]`, `hidden boolean`, `source_note? text`, `updated_at timestamptz` | PK/FK `feature_id → map.feature`. Apply geometry replacement, tag removals and then tag overrides before basemap derivation. | `ROAD1` (way `51001`), `set_tags={"width":"7.2"}`, `hidden=false`, tape measurement |

Keep the PBF as the source for ordered node references and relation membership when those are needed. `smart` completes ways and qualifying multipolygons with its default settings. Check any additional relation types used by indoor or building imports for reference completeness before deriving connections or part membership. Persist the resulting application features and connections in the relevant tables. [Osmium extract strategies](https://docs.osmcode.org/osmium/latest/osmium-extract.html#strategies) · [Local mapping](../database/kavala.lua)

A missing OSM reference retains its project UUID and edits. The OSM-linked feature can return to the basemap when its reference resolves again. Recovered `places.place.id` values become the matching `map.feature.id` values during migration.

## 2. Generated drawings

The existing SQL generates road surface polygons, sidewalk polygons, clipped crossing lines, track lanes and bleacher rows. The proposed tables add reusable drawing inputs, authored corrections and paint geometry such as pitch lines and zebra stripes. [Existing derivations](../database/basemap-views.sql)

The generator builds map-scale lines, polygons and symbol anchors from road tags, surveyed geometry and per-feature parameters. MapLibre paints the generated pieces. Rules can generate road striping, pitch markings, track lanes, bleacher rows and similar graphics. The proposed inference policy allows a pitch template where the inputs establish its footprint and orientation. Use explicit source or surveyed inputs for turn arrows and other driving instructions.

| Proposed table or view | Columns | Keys and rules | Example entry |
| --- | --- | --- | --- |
| `map.drawing_input` | `feature_id uuid`, `rule_key text`, `enabled boolean`, `input_geom? geometry`, `parameters jsonb`, `evidence text`, `updated_at timestamptz` | PK `(feature_id, rule_key)`. FK to `map.feature`. Rule implementations define allowed parameters, units and geometry. Each row supplies or adjusts a rule's inputs for a feature. | `PITCH1`, `football_pitch`, surveyed centreline, `{"length_m":100,"width_m":64}`, `surveyed` |
| `map.drawing_edit` | `feature_id uuid`, `rule_key text`, `part_key text`, `action text`, `geom? geometry`, `mark_kind? text`, `source_note? text` | PK `(feature_id, rule_key, part_key)`. FK to `map.feature`. Actions `add` and `replace` require geometry. `hide` suppresses the named generated part. | `PITCH1`, `football_pitch`, `centre-circle`, `replace`, surveyed linework |
| `basemap.generated_markings` | `mark_id text`, `parent_key text`, `parent_feature_id? uuid`, `rule_key text`, `part_key text`, `mark_kind text`, `evidence text`, `surface_z_m? double precision`, `geom geometry` | Derived view. `mark_id` is deterministic from parent, rule and part. OSM-backed features keep their typed OSM parent key after registration. Custom features use their project UUID. Use absolute Z where the surface elevation is known, including raised decks. | `PITCH1/football_pitch/touchline-north`, `pitch_line`, `surveyed`, `surface_z_m=81.8`, line |

## 3. Height references, buildings and assets

Absolute `z_m` values are elevations above the WGS 84 ellipsoid. Building, floor and object offsets use their named local references. Convert source elevations in other vertical datums before filling absolute fields and record the source. An unknown elevation stays `NULL`. Zero is a valid offset. This absolute reference matches GeoJSON Z and geographic region heights in 3D Tiles. [GeoJSON RFC 7946](https://www.rfc-editor.org/rfc/rfc7946.html#section-4) · [OGC 3D Tiles 1.1](https://docs.ogc.org/cs/22-025r4/22-025r4.html)

The existing `basemap.buildings` view exposes OSM `height`, `min_height` and roof tags as text. Simple 3D Buildings uses `height` for the distance from ground to the roof top and `min_height` for the distance to the base of a raised structure. Those are inputs for extrusion. To resolve an absolute building elevation, align them to the corresponding ground reference. OSM documents `ele=*` as an elevation relative to the EGM96 geoid. Convert it before storing an ellipsoidal Z. [Existing building view](../database/basemap-views.sql) · [Simple 3D Buildings](https://wiki.openstreetmap.org/wiki/Simple_3D_Buildings#Tagging_for_building_outlines_and_parts) · [OSM elevation tag](https://wiki.openstreetmap.org/wiki/Key:ele)

| Proposed table | Columns | Keys and rules | Example entry |
| --- | --- | --- | --- |
| `media.asset` | `id uuid`, `object_key? text`, `external_url? text`, `media_type text`, `sha256? text`, `bundle_prefix? text`, `access text` | PK `id`. Exactly one of `object_key` and `external_url`. Bundles keep the entry file and its relative paths to child files. An object storage provider can be chosen separately. Use for photos, DEMs, PBFs, GLBs and tilesets. | `A_MESH`, `models/north-building/v1.glb`, `model/gltf-binary`, public. `A_PBF`, `osm/kavala/2026-11-19.osm.pbf`, private. |
| `map.elevation_dataset` | `id uuid`, `asset_id uuid`, `coverage_geom MultiPolygon`, `horizontal_crs text`, `vertical_datum text`, `resolution_m? double precision`, `source_at? date`, `priority smallint` | PK `id`. FK to `media.asset`. Sample the highest-priority dataset covering the location, then convert its source elevation to the common vertical reference. | `DEM1`, terrain COG `A_DEM`, campus extent, `EPSG:2100`, surveyed datum, `resolution_m=1` |
| `map.building` | `id uuid`, `reference_geom Point`, `reference_z_m? double precision`, `reference_z_source? text`, `reference_z_accuracy_m? double precision`, `base_offset_m? double precision`, `top_offset_m? double precision` | PK/FK `id → map.feature`. Footprint comes from the effective feature. Offsets measure from the same fixed building reference point. Top exceeds base when both are known. | `B1`, surveyed ground-floor datum `82.40 m`, base offset `0.00`, top offset `14.20` |
| `map.building_part` | `id uuid`, `building_id uuid`, `part_kind text`, `geom MultiPolygon`, `base_offset_m double precision`, `top_offset_m double precision`, `roof_shape? text`, `roof_direction_deg? double precision`, `material_key? text` | PK `id`. FK to building. Each wing, roof or canopy can have its own footprint and height range relative to the building reference. | `PART1`, `B1`, `canopy`, entrance outline, base `3.10`, top `3.45`, `flat` |
| `map.building_model` | `id uuid`, `building_id uuid`, `asset_id uuid`, `revision integer`, `active boolean`, `coverage_geom? MultiPolygon`, `placement_mode text`, `anchor_geom? Point`, `anchor_offset_m? double precision`, `yaw_deg? double precision`, `scale? double precision` | PK `id`. FKs to building and asset. Unique `(building_id, revision)`. One active model per building. A null coverage means the whole building. `local` uses the anchor point, building-relative height, yaw clockwise from true north and scale. `georeferenced` uses the asset's own transform. | `MODEL1`, `B1`, `A_MESH`, revision 1, active, `local`, surveyed entrance, offset `0`, yaw `17°`, scale `1` |

A building can use editable parts, a manually modelled asset, or both. For a partial model, the 3D representation can use that model alongside the uncovered parts. The standard style can render the same building footprint with its extrusion values.

## 4. Indoor floors, objects and connections

OpenStreetMap Simple Indoor Tagging assigns indoor elements to floors with `level=*`. An optional `indoor=level` outline can describe a floor. `level:ref=*` records the label people see on signs. A door with `level=0` and `repeat_on=1` produces a placement on each of those floors. A shaft with `level=0;1` spans both floors as one feature. Finished-floor elevations come from measurements or documented estimates. [Simple Indoor Tagging](https://wiki.openstreetmap.org/wiki/Simple_Indoor_Tagging)

| Proposed table | Columns | Keys and rules | Example entry |
| --- | --- | --- | --- |
| `indoor.floor` | `id uuid`, `building_id uuid`, `level_key text`, `level_ref? text`, `label text`, `sort_order numeric`, `floor_offset_m? double precision`, `clearance_m? double precision`, `height_source? text`, `geom? MultiPolygon` | PK `id`. FK to `map.building`. Unique `(building_id, level_key)`. Map OSM `level=*` to `level_key` and signage to `level_ref`. The offset is finished-floor elevation relative to the building reference. | In `B1`, level `-1` at `−3.20 m`, level `0` at `0.00 m`, level `1` represented by `F1` at `3.80 m` |
| `indoor.feature` | `id uuid`, `building_id uuid`, `kind text`, `label? text`, `access? text`, `wheelchair? text`, `level_mode text`, `attributes jsonb` | PK/FK `id → map.feature`. FK to building. One feature identity. Mode is `single`, `repeated` or `spanning`. The effective feature supplies the geometry and OSM tags when available. | `R210`, `B1`, office polygon, `single`. `D_LIFT`, `B1`, door mapped as one OSM node, `repeated`. |
| `indoor.feature_floor` | `feature_id uuid`, `floor_id uuid`, `space_id? uuid`, `geom_override? geometry`, `floor_offset_m double precision`, `height_m? double precision` | PK `(feature_id, floor_id)`. FKs to feature and floor. Both belong to the same building. An enclosing space must be placed on that floor. Use source geometry unless a floor-specific geometry is supplied. Offset locates the object's base above the floor. | `D_LIFT` has a row on `FG` and another on `F1`. `BIN1` is in `R210` on `F1`, height `0.75 m`. |
| `indoor.connector` | `id uuid`, `building_id uuid`, `kind text`, `label? text`, `wheelchair? text` | PK `id`. FK to building. Groups landings for an elevator, staircase, ramp or escalator. | `LIFT1`, `B1`, elevator, West lift, wheelchair accessible |
| `indoor.connection` | `id uuid`, `from_feature_id uuid`, `from_floor_id uuid`, `to_feature_id uuid`, `to_floor_id uuid`, `via_feature_id? uuid`, `via_floor_id? uuid`, `connector_id? uuid`, `kind text`, `direction text`, `from_floor_offset_m double precision`, `to_floor_offset_m double precision`, `clear_width_m? double precision`, `access? text` | PK `id`. Each endpoint and optional door use the composite key in `indoor.feature_floor`. Connector FK targets `indoor.connector`. Offsets are relative to the respective finished floors. A cross-floor connector and its endpoints belong to the same building. | `LINK1`, `(R210,F1)` ↔ `(HALL1,F1)` via `(D210,F1)`. `LINK2`, `(D_LIFT,FG)` ↔ `(D_LIFT,F1)` via `LIFT1`. |
| `indoor.connection_vertex` | `connection_id uuid`, `sequence integer`, `geom Point`, `building_offset_m double precision` | PK `(connection_id, sequence)`. FK to connection. Optional surveyed Z profile for ramps, stairs and bends. Heights use the building reference. | Ramp `RAMP_LINK1`, points 1–3 at building offsets `3.80`, `4.00` and `4.25 m` |

For an imported door in the boundary of a room, use the shared OSM node ID and its floor as evidence for a connection. The current PostGIS footprint rows carry geometry only. A future indoor import can read the node references from the PBF and use verified shared nodes to populate `indoor.connection`. Surveyed or manually mapped connections use the same table. [Simple Indoor Tagging](https://wiki.openstreetmap.org/wiki/Simple_Indoor_Tagging) · [PBF way references](https://github.com/openstreetmap/OSM-binary/blob/master/osmpbf/osmformat.proto)

| Feature | Floor placement | Kind | Geometry | Example attributes |
| --- | --- | --- | --- | --- |
| `R210` | `F1` | `office` | Polygon | Room 210, linked to people and departments through Places |
| `HALL1` | `F1` | `corridor` | Polygon | Public circulation and surveyed width |
| `D210` | `F1` | `door` | Point or line | Office to corridor, clear width `0.90 m` |
| `EXIT1` | `FG` | `emergency_exit` | Point or line | Exit-only connection to an exterior landing |
| `SEAT1` | `F1` | `seating_area` | Polygon | Capacity 12. Individual seats can have separate rows. |
| `BIN1` | `F1` | `waste_bin` | Point | Height `0.75 m` and waste type |
| `RAMP1` | `F1` | `ramp` | Line or polygon | Rise `0.45 m`, linked endpoints and surveyed profile |
| `D_LIFT` | `FG` and `F1` | `elevator_door` | Point | Both placements link to `LIFT1` |
| `STAIR1` | `F1` | `stair_landing` | Point or polygon | Stair connector, step count and handrail information |

## 5. Places, departments, offices and reviews

The current `places.place` owns its UUID, source type and ID, and custom geometry. Its image table stores an external `url`. Existing department and occupant links already support shared offices. The draft below proposes moving source identity and geometry into `map.feature`, keeping Place UUIDs, and resolving images through `media.asset`. [Existing Places migration](../database/migrations/003_places.sql)

A building or room can also be a Place using the same UUID. A service sharing a room can have its own Place with an anchor on the room.

| Table | Columns | Keys and rules | Example entry |
| --- | --- | --- | --- |
| `places.place` | `id uuid`, `name? text`, `category? text`, `subtype? text`, `created_at timestamptz` | PK/FK `id → map.feature`. Editable name and classification. Map identity and source geometry come from the shared feature. | `R210`, Room 210, `education`, `office`. `CAFE1`, Campus Cafeteria, `food`, `cafeteria`. |
| `places.anchor` | `place_id uuid`, `geom? Point`, `height_mode text`, `building_id? uuid`, `floor_id? uuid`, `indoor_feature_id? uuid`, `absolute_z_m? double precision`, `offset_m? double precision`, `height_source? text` | PK/FK `place_id`. Mode is `terrain`, `absolute`, `building`, `floor` or `indoor_feature`. It selects the required height value and related record. Contextual references must agree on building and floor. Mode indoor_feature uses both the indoor feature ID and floor ID. Resolve XY from the explicit point, the linked floor placement, or the Place geometry. | `R210`, `floor`, `F1`, offset `1.20 m`. Building `82.40 m` + floor `3.80 m` + marker `1.20 m` = `87.40 m`. |
| `places.enrichment` | `place_id uuid`, `description? text`, `website? text`, `phone? text`, `opening_hours? text`, `wikidata? text`, `wikipedia? text` | PK/FK `place_id`. Persistent editorial details. | `CAFE1`, student dining and opening hours |
| `places.image` | `id uuid`, `place_id uuid`, `asset_id uuid`, `caption? text`, `credit? text`, `license? text`, `sort_order integer` | PK `id`. FKs to Place and asset. External images use `media.asset.external_url`. | `PIC1`, `B1`, `A_PHOTO`, front entrance, sort order 0 |
| `places.department` | `id uuid`, `code text`, `name text`, `website? text` | PK `id`. Unique `code`. Departments share this table. | `DEPT1`, `ENG`, Example Department of Engineering |
| `places.place_department` | `place_id uuid`, `department_id uuid` | Composite PK/FKs. Links rooms, buildings and services to one or more departments. | `R210` → `DEPT1` |
| `places.person` | `id uuid`, `name text`, `email? text`, `description? text` | PK `id`. | `PERSON1`, Professor Example |
| `places.person_department` | `person_id uuid`, `department_id uuid` | Composite PK/FKs. | `PERSON1` → `DEPT1` |
| `places.occupant` | `place_id uuid`, `person_id uuid`, `role? text`, `office_hours? text` | Composite PK/FKs. Change these links when an office is shared or someone moves. | `R210`, `PERSON1`, professor, Wednesday 10:00–12:00 |
| `places.review` (optional) | `id uuid`, `place_id uuid`, `author_subject text`, `rating smallint`, `body? text`, `status text`, `created_at timestamptz`, `updated_at timestamptz` | PK `id`. FK to Place. API account identity in `author_subject`. Rating 1–5. | `REV1`, `CAFE1`, example account, rating 4, “Good vegetarian options”, published |
| `places.review_image` (optional) | `review_id uuid`, `asset_id uuid`, `sort_order integer` | Composite PK/FKs. Reuses `media.asset`. | `REV1`, `A_REVIEW_PHOTO`, sort order 0 |
| `public.poi_metadata` (legacy) | `osm_type text`, `osm_id bigint`, `image_url? text`, `image_credit? text`, `website? text`, `wikidata? text`, `wikipedia? text`, `phone? text`, `opening_hours? text`, `description? text`, `extra jsonb`, `created_at timestamptz`, `updated_at timestamptz` | Existing composite PK. Migration input for enrichment and photos through typed OSM references. Preserve unmatched rows and extra fields during migration. | OSM way `61001` with a photo URL and credit |

For a floor-relative feature, its absolute base is building reference Z + floor offset + feature offset. Add `height_m` for its top. A POI can sit on the floor, use an offset above a mapped object, or use a building-relative offset for a rooftop sign. Absolute elevations are resolved from these inputs for publishing.


| POI height mode | Required input | Resolved anchor elevation |
| --- | --- | --- |
| `terrain` | XY and a terrain elevation at that point | Terrain Z + offset |
| `absolute` | `absolute_z_m` | The stored ellipsoidal elevation |
| `building` | `building_id` | Building reference Z + offset |
| `floor` | `floor_id` | Building reference Z + finished-floor offset + pin offset |
| `indoor_feature` | `(indoor_feature_id, floor_id)` | Base Z on that floor + pin offset |

Omitted pin offsets default to zero. An unresolved terrain, building or floor elevation leaves the absolute anchor Z unknown while the 2D location remains available.

## 6. Food and bus ETAs

Food connects to a cafeteria Place. Daily fetches translate the API's rotating schedule into local service dates. Bus ETAs use the existing Transit API and its provider stop codes. [Food Schedule response](../../Food-Schedule/api/index.php) · [Transit API contract](../../API/docs/transit.md)

| Table | Columns | Keys and rules | Example entry |
| --- | --- | --- | --- |
| `food.venue` | `place_id uuid`, `provider text`, `provider_venue_key text`, `service_timezone text` | PK/FK `place_id → places.place`. Unique `(provider, provider_venue_key)`. | `CAFE1`, `food-schedule`, `kavala-campus`, `Europe/Athens` |
| `food.menu_snapshot` | `id uuid`, `place_id uuid`, `service_date date`, `fetched_at timestamptz`, `source_revision? text`, `content_hash text`, `service_status text`, `note? text` | PK `id`. FK to `food.venue`. Unique `(place_id, service_date, fetched_at)` for retries of the same fetch. The latest successful snapshot is current. A confirmed closure can have an empty menu. | `MENU1`, `CAFE1`, `2026-11-20`, fetched `06:00+02:00`, open |
| `food.menu_item` | `snapshot_id uuid`, `meal text`, `sort_order smallint`, `name text`, `description? text`, `allergens? text[]`, `dietary_labels? text[]` | PK `(snapshot_id, meal, sort_order)`. FK to snapshot. Only populate allergens and dietary labels when supplied. | `MENU1`, lunch, 1, Ριζότο Λαχανικών |
| `map.transit_stop_ref` | `feature_id uuid`, `provider text`, `stop_code text` | PK `(provider, stop_code)`. FK to `map.feature`. One map stop can link to several provider codes. Codes remain text. | `STOP1` (OSM node `41001`), CityBus, `1004` |

### Existing tables in the Transit API database

The map calls arrivals by provider stop code. The Transit API owns these records and their retention. [Transit PostgreSQL migration](../../API/internal/databases/migrations/transit_postgres/000001_init.up.sql)

| Table | Columns | Example entry |
| --- | --- | --- |
| `transit.transit_catalog` | `id bigint PK`, `payload text` | `1`, JSON of stops, routes and scheduled service |
| `transit.transit_observations` | `id bigint PK`, `observed_at bigint`, `vehicle_code text`, `route_code text`, `stop_code text`, `latitude double precision`, `longitude double precision`, `raw text` | Vehicle `V12` on route `04` near stop `1004`, with the provider payload and observation time in Unix milliseconds |
| `transit.transit_samples` | `id bigint PK`, `route_code text`, `kind text`, `sequence integer`, `weekday integer`, `bucket integer`, `observed_at bigint`, `seconds double precision` | Route `04`, sequence 6, travel sample of `82 s` |
| `transit.transit_predictions` | `id bigint PK`, `generated_at bigint`, `trip_id text`, `stop_code text`, `sequence integer`, `p10 bigint`, `p50 bigint`, `p90 bigint`, `actual_at? bigint` | `TRIP1`, stop `1004`, sequence 6, median arrival 08:12 local time. Bounds are stored as Unix seconds. |
| `transit.transit_actuals` | `trip_id text`, `sequence integer`, `arrived_at bigint` | PK `(trip_id, sequence)`. `TRIP1`, sequence 6, actual arrival 08:13 local time. |

## 7. Derived views and tile entries

Existing source IDs and fields are the compatibility baseline. The rows below show the principal view columns. [Existing basemap definitions](../database/basemap-views.sql) · [Places tile view](../database/migrations/004_place_tiles.sql)

| View | Main columns | Example entry |
| --- | --- | --- |
| `map.effective_feature` | `source_key`, `feature_id?`, `osm_type?`, `osm_id?`, `tags`, `missing_osm_reference`, `geom` | OSM way `51001` with corrected width |
| `map.kavala_boundary` | `area_id`, `name`, `name_el`, `name_en`, `admin_level`, `tags`, `geom` | Municipality relation `2346651` or its fallback |
| `map.aoi` | `area_id`, `name`, `geom` | Kavala municipality buffered by 5 km |
| `basemap.transportation` | `way_id`, `highway`, `railway`, `name`, `sidewalk`, `geom` | Secondary road centreline |
| `basemap.transportation_areas` | `area_id`, `highway`, `amenity`, `parking`, `geom` | Parking area polygon |
| `basemap.road_surfaces` (materialized) | `way_id`, `highway`, `surface`, `width_m`, `geom` | Road `51001`, width `7.2 m`, asphalt polygon |
| `basemap.sidewalk_surfaces` (materialized) | `way_id`, `sidewalk`, `geom` | Road `51001`, `both`, sidewalk polygons |
| `basemap.crossing_markings` (materialized) | `way_id`, `crossing`, `crossing_markings`, `geom` | Crossing centreline clipped by the road surface. Generated stripes use `basemap.generated_markings`. |
| `basemap.named_roads` | `road_id`, `display_name`, `highway`, `geom` | Grouped linework for a selected named road |
| `basemap.named_road_surfaces` | `way_id`, `road_id`, `display_name`, `width_m`, `geom` | Asphalt belonging to that same named road |
| `basemap.buildings` | Existing `area_id`, `building`, `building_part`, `height`, `min_height`, `geom`. Add `building_uuid?`, `base_z_m?`, `top_z_m?`. | `61001`, university footprint, `B1`, base `82.40 m`, top `96.60 m` |
| `basemap.building_labels` | `area_id`, `display_name`, `building`, `geom` | North Building label |
| `basemap.building_parts_3d` (proposed) | `part_id`, `building_uuid`, `part_kind`, `base_z_m?`, `top_z_m?`, `roof_shape?`, `material_key?`, `geom` | Canopy `PART1`, base `85.50 m`, top `85.85 m` |
| `basemap.building_models_3d` (proposed) | `building_uuid`, `model_id`, `asset_id`, `placement_mode`, `geom`, `coverage_geom?`, `anchor_z_m?`, `yaw_deg?`, `scale?` | Active model for `B1` at the surveyed entrance datum |
| `basemap.land` | `area_id`, `landuse`, `natural`, `leisure`, `sport`, `geom` | Football pitch footprint |
| `basemap.water` | `area_id`, `natural`, `water`, `waterway`, `geom` | Pond polygon |
| `basemap.waterways` | `way_id`, `waterway`, `name`, `geom` | Stream centreline |
| `basemap.coastline` | `way_id`, `name`, `geom` | OSM coastline segment |
| `basemap.barriers` | `way_id`, `barrier`, `height`, `width`, `geom` | Fence line |
| `basemap.barrier_points` | `node_id`, `barrier`, `entrance`, `access`, `geom` | Gate point |
| `basemap.area_labels` | `area_id`, `name`, `name_el`, `name_en`, `geom` | Campus area label |
| `basemap.place_labels` | `node_id`, `place`, `name`, `name_el`, `name_en`, `population`, `geom` | Kavala city label |
| `basemap.poi` (internal) | `osm_type`, `osm_id`, `name`, selected OSM classification fields, `geom` | Raw OSM-derived cafeteria POI |
| `basemap.poi_render` (internal) | `poi_id`, `osm_type`, `osm_id`, `display_name`, `category`, `subtype`, `importance`, `label_rank`, `building_id`, `geom` | Classified cafeteria POI with its covering building |
| `places.resolved` (internal) | `id`, `display_name`, `map_category`, `map_subtype`, `map_geom`, `missing_osm_reference`. Add `building_uuid?`, `floor_id?`, `anchor_z_m?`. | `R210` on `F1` at `87.40 m` |
| `places.details` (API) | `place_id`, `origin`, `osm_type`, `osm_id`, `display_name`, `description`, `missing_osm_reference`, `images`, `occupants`, `departments` | Room 210 with its department and professor |
| `basemap.places` | Existing `place_id`, `display_name`, `category`, `subtype`, `origin`, `missing_osm_reference`, `department_ids`, `importance`, `label_rank`, `building_id`, `geom`. Add `building_uuid?`, `floor_id?`, `anchor_z_m?`. | Room 210 marker on level 1 at `87.40 m` |
| `basemap.transit_stops` | Existing `stop_id`, `osm_id`, `display_name`, `geom`. Add `feature_id?` for provider lookup. | `node:41001`, Campus, `STOP1` |
| `basemap.running_track_lanes` | `area_id`, `lane_no`, `geom` | Running track lane 3 |
| `basemap.bleacher_rows` | `area_id`, `row_no`, `geom` | Bleacher row 4 |
| `basemap.indoor_floors` (proposed) | `floor_id`, `building_uuid`, `level_key`, `level_ref?`, `label`, `sort_order`, `floor_z_m?`, `geom` | Level 1 at `86.20 m` |
| `basemap.indoor_features` (proposed) | `feature_id`, `floor_id`, `kind`, `label?`, `level_mode`, `base_z_m?`, `top_z_m?`, `geom` | One row per floor placement. Level-1 bin, base `86.20 m` and top `86.95 m`. |

`basemap.ocean` is listed with the persistent seeds and `basemap.generated_markings` with the drawing tables. The published geometries carry horizontal positions. The Z fields are scalar properties for clients that place objects, floors and markers in 3D.
