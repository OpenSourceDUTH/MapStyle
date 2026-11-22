-- Provision these group roles separately from application logins.
GRANT USAGE ON SCHEMA public, basemap TO maps;
GRANT SELECT ON
    basemap.area_labels, basemap.barrier_points, basemap.barriers,
    basemap.bleacher_rows, basemap.building_labels, basemap.buildings,
    basemap.coastline, basemap.crossing_markings, basemap.land,
    basemap.named_road_surfaces, basemap.named_roads, basemap.ocean,
    basemap.place_labels, basemap.places, basemap.road_surfaces,
    basemap.running_track_lanes, basemap.sidewalk_surfaces,
    basemap.transit_stops, basemap.transportation, basemap.transportation_areas,
    basemap.water, basemap.waterways
TO maps;

GRANT USAGE ON SCHEMA public, places TO maps_editor;
GRANT SELECT ON places.resolved, places.department TO maps_editor;
GRANT SELECT, INSERT, UPDATE ON places.place TO maps_editor;
GRANT SELECT, INSERT, DELETE ON places.place_department TO maps_editor;
