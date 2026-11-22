CREATE OR REPLACE VIEW basemap.places AS
SELECT p.id::text AS place_id, p.display_name, p.map_category AS category, p.map_subtype AS subtype,
 p.origin, p.missing_osm_reference,
 ARRAY(SELECT department_id::text FROM places.place_department d WHERE d.place_id=p.id ORDER BY department_id) AS department_ids,
 p.map_geom::geometry(Point,4326) AS geom,
 p.importance, p.label_rank, p.building_id
FROM places.resolved p
WHERE p.map_geom IS NOT NULL;
