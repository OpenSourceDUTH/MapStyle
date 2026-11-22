\set ON_ERROR_STOP on
BEGIN;
SET LOCAL search_path = public;

-- Fail before touching serving tables if the import did not produce all layers.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM mapstyle_osm_stage.osm_points)
       OR NOT EXISTS (SELECT 1 FROM mapstyle_osm_stage.osm_lines)
       OR NOT EXISTS (SELECT 1 FROM mapstyle_osm_stage.osm_polygons) THEN
        RAISE EXCEPTION 'The staged extract must contain points, lines and polygons';
    END IF;
END;
$$;

-- Keep relation identities so existing views and grants survive.
DELETE FROM public.osm_points;
INSERT INTO public.osm_points (node_id, tags, geom)
SELECT node_id, tags, geom FROM mapstyle_osm_stage.osm_points;

DELETE FROM public.osm_lines;
INSERT INTO public.osm_lines (way_id, tags, geom)
SELECT way_id, tags, geom FROM mapstyle_osm_stage.osm_lines;

DELETE FROM public.osm_polygons;
INSERT INTO public.osm_polygons (area_id, tags, geom)
SELECT area_id, tags, geom FROM mapstyle_osm_stage.osm_polygons;

DELETE FROM public.osm2pgsql_properties;
INSERT INTO public.osm2pgsql_properties (property, value)
SELECT property, value FROM mapstyle_osm_stage.osm2pgsql_properties;

ANALYZE public.osm_points, public.osm_lines, public.osm_polygons;
\ir sync-places.sql

REFRESH MATERIALIZED VIEW basemap.road_surfaces;
REFRESH MATERIALIZED VIEW basemap.crossing_markings;
REFRESH MATERIALIZED VIEW basemap.sidewalk_surfaces;
ANALYZE basemap.road_surfaces, basemap.crossing_markings, basemap.sidewalk_surfaces;
\ir ../verify/geometries.sql

COMMIT;
