-- Area IDs are positive for ways and negative for relations in the Flex import.
INSERT INTO places.place (origin, osm_type, osm_id)
SELECT DISTINCT 'osm',
       CASE WHEN osm_type <> 'area' THEN osm_type
            WHEN osm_id < 0 THEN 'relation'
            ELSE 'way' END,
       abs(osm_id)
FROM basemap.poi_render
WHERE osm_id <> 0
ON CONFLICT (osm_type, osm_id) DO NOTHING;
