\set ON_ERROR_STOP on
SET search_path = public;

DO $$
DECLARE layer regclass;
DECLARE bad bigint;
BEGIN
    FOREACH layer IN ARRAY ARRAY[
        'map.kavala_boundary', 'map.aoi', 'map.coastline_derived', 'basemap.ocean',
        'basemap.road_surfaces', 'basemap.sidewalk_surfaces', 'basemap.crossing_markings', 'basemap.places'
    ]::regclass[] LOOP
        EXECUTE format('SELECT count(*) FROM %s WHERE geom IS NULL OR ST_SRID(geom) <> 4326 OR ST_IsEmpty(geom) OR NOT (ST_IsValidDetail(geom)).valid', layer) INTO bad;
        IF bad > 0 THEN
            RAISE EXCEPTION '% contains % invalid, empty or misprojected geometries', layer, bad;
        END IF;
    END LOOP;

    IF EXISTS (SELECT 1 FROM map.kavala_boundary)
       AND NOT EXISTS (SELECT 1 FROM map.aoi) THEN
        RAISE EXCEPTION 'Kavala AOI is missing despite a boundary';
    END IF;
END;
$$;
