-- Canonical Kavala municipality boundary (OSM area -2346651).
-- The original JSON/EWKB is kept in data/kavala-boundary.json.
CREATE TABLE IF NOT EXISTS map.kavala_boundary_source (
    area_id bigint PRIMARY KEY,
    name text NOT NULL,
    name_el text,
    name_en text,
    admin_level text,
    tags jsonb NOT NULL,
    geom geometry(MultiPolygon, 4326) NOT NULL
);
