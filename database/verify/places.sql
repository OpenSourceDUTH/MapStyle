\set ON_ERROR_STOP on
BEGIN;

DO $$
DECLARE a uuid; b uuid;
BEGIN
 INSERT INTO places.place(origin,name,category,subtype,geom)
 VALUES ('custom','Test fixture','education','office',ST_MakeEnvelope(24.37,40.92,24.39,40.94,4326)) RETURNING id INTO a;
 INSERT INTO places.place(origin,osm_type,osm_id) VALUES ('osm','node',9223372036854775807) RETURNING id INTO b;
 IF NOT (SELECT missing_osm_reference FROM places.details WHERE place_id=b) THEN RAISE EXCEPTION 'Missing reference not marked'; END IF;
 INSERT INTO places.image(place_id,url) VALUES(a,'https://example.org/fixture.png'),(a,'https://example.org/fixture2.png');
 WITH f AS (INSERT INTO places.person(name) VALUES ('Fixture A'),('Fixture B') RETURNING id)
 INSERT INTO places.occupant(place_id,person_id) SELECT a,id FROM f;
 WITH f AS (INSERT INTO places.department(name) VALUES ('Fixture A'),('Fixture B') RETURNING id)
 INSERT INTO places.place_department(place_id,department_id) SELECT a,id FROM f;
 IF (SELECT count(*) FROM places.details WHERE place_id=a)<>1 OR
    (SELECT jsonb_array_length(images) + jsonb_array_length(occupants) + jsonb_array_length(departments) FROM places.details WHERE place_id=a)<>6 THEN RAISE EXCEPTION 'Aggregation mismatch'; END IF;
 IF (SELECT count(*) FROM basemap.places WHERE place_id=a::text AND GeometryType(geom)='POINT' AND ST_SRID(geom)=4326)<>1
    OR EXISTS (SELECT 1 FROM basemap.places WHERE place_id=b::text) THEN
  RAISE EXCEPTION 'Spatial feature mismatch';
 END IF;
 BEGIN
  INSERT INTO places.place(origin,osm_type,osm_id) VALUES ('osm','node',9223372036854775807);
  RAISE EXCEPTION 'Duplicate identity accepted';
 EXCEPTION WHEN unique_violation THEN NULL; END;
 BEGIN
  INSERT INTO places.place(origin,name) VALUES ('custom','invalid');
  RAISE EXCEPTION 'Custom missing geometry accepted';
 EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

SET LOCAL ROLE maps;
SELECT place_id, display_name, importance, label_rank, building_id FROM basemap.places LIMIT 1;
RESET ROLE;

SET LOCAL ROLE maps_editor;
INSERT INTO places.place (id, origin, name, category, geom)
VALUES ('3afeb918-982b-4fa4-aa87-247194afb02f', 'custom', 'Editor fixture', 'education', ST_SetSRID(ST_MakePoint(24.38,40.93),4326));
UPDATE places.place SET name = 'Updated fixture' WHERE id = '3afeb918-982b-4fa4-aa87-247194afb02f';
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM places.resolved WHERE id='3afeb918-982b-4fa4-aa87-247194afb02f' AND display_name='Updated fixture') THEN
        RAISE EXCEPTION 'Editor cannot read its update through places.resolved';
    END IF;
END;
$$;
RESET ROLE;

DO $$
BEGIN
    IF has_schema_privilege('maps','places','USAGE')
       OR has_table_privilege('maps','places.details','SELECT')
       OR has_table_privilege('maps','public.osm_points','SELECT')
       OR has_table_privilege('maps','places.place','INSERT')
       OR has_table_privilege('maps_editor','places.person','SELECT') THEN
        RAISE EXCEPTION 'A runtime role has unexpected map or Places privileges';
    END IF;
END;
$$;

ROLLBACK;
