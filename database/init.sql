\set ON_ERROR_STOP on
BEGIN;

CREATE SCHEMA map;
CREATE SCHEMA basemap;
SET LOCAL search_path = public;

-- These IDs identify OSM objects and support per-place lookups.
CREATE UNIQUE INDEX osm_points_node_id_idx ON public.osm_points (node_id);
CREATE UNIQUE INDEX osm_lines_way_id_idx ON public.osm_lines (way_id);
CREATE UNIQUE INDEX osm_polygons_area_id_idx ON public.osm_polygons (area_id);

CREATE TABLE map.coastline_derived (
    id bigint PRIMARY KEY,
    geom geometry(Geometry, 4326) NOT NULL
        CHECK (GeometryType(geom) IN ('LINESTRING', 'MULTILINESTRING'))
);
CREATE INDEX coastline_derived_geom_idx ON map.coastline_derived USING gist (geom);

CREATE TABLE basemap.ocean (
    id bigint PRIMARY KEY,
    class text,
    geom geometry(Geometry, 4326) NOT NULL
        CHECK (GeometryType(geom) IN ('POLYGON', 'MULTIPOLYGON'))
);
CREATE INDEX ocean_geom_idx ON basemap.ocean USING gist (geom);

SET LOCAL search_path = public;
SET LOCAL client_min_messages = warning;
\ir schema/004-poi-metadata.sql
\ir schema/005-boundary.sql
\ir schema/003-basemap-views.sql
\ir schema/005-boundary.sql
\ir schema/006-places.sql
\ir schema/007-place-tiles.sql
\ir import/sync-places.sql
\ir schema/008-grants.sql

COMMIT;
