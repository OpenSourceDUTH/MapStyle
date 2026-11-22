CREATE SCHEMA IF NOT EXISTS places;
REVOKE ALL ON SCHEMA places FROM PUBLIC;
CREATE TABLE places.place (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 origin text NOT NULL CHECK (origin IN ('osm','custom')),
 osm_type text CHECK (osm_type IN ('node','way','relation')),
 osm_id bigint CHECK (osm_id>0),
 name text, category text, subtype text,
 geom geometry(Geometry,4326),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((origin='osm' AND osm_type IS NOT NULL AND osm_id IS NOT NULL AND geom IS NULL)
     OR (origin='custom' AND osm_type IS NULL AND osm_id IS NULL AND geom IS NOT NULL AND name IS NOT NULL)),
 CHECK (geom IS NULL OR (NOT ST_IsEmpty(geom) AND ST_IsValid(geom))),
 UNIQUE(osm_type,osm_id)
);
CREATE INDEX place_geom_idx ON places.place USING gist(geom);
CREATE TABLE places.enrichment (
 place_id uuid PRIMARY KEY REFERENCES places.place(id), description text
);
CREATE TABLE places.image (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 place_id uuid NOT NULL REFERENCES places.place(id),
 url text NOT NULL CHECK (url ~ '^https?://'),
 caption text, credit text, license text, sort_order integer NOT NULL DEFAULT 0
);
CREATE INDEX image_place_idx ON places.image(place_id);
CREATE TABLE places.person (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL,
 email text, description text
);
CREATE TABLE places.occupant (
 place_id uuid REFERENCES places.place(id), person_id uuid REFERENCES places.person(id),
 role text, office_hours text, PRIMARY KEY(place_id,person_id)
);
CREATE INDEX occupant_person_idx ON places.occupant(person_id);
CREATE TABLE places.department (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, code text UNIQUE
);
CREATE TABLE places.place_department (
 place_id uuid REFERENCES places.place(id), department_id uuid REFERENCES places.department(id),
 PRIMARY KEY(place_id,department_id)
);
CREATE INDEX place_department_department_idx ON places.place_department(department_id);
CREATE TABLE places.person_department (
 person_id uuid REFERENCES places.person(id), department_id uuid REFERENCES places.department(id),
 PRIMARY KEY(person_id,department_id)
);
CREATE INDEX person_department_department_idx ON places.person_department(department_id);
CREATE VIEW places.resolved AS
SELECT p.*, coalesce(p.name,r.display_name,raw.tags->>'name:el',raw.tags->>'name',raw.tags->>'name:en') AS display_name,
 coalesce(p.category,r.category,'other') AS map_category,
 coalesce(p.subtype,r.subtype,'marker') AS map_subtype,
 coalesce(ST_PointOnSurface(p.geom),r.geom,ST_PointOnSurface(raw.geom)) AS map_geom,
 (p.origin='osm' AND raw.geom IS NULL) AS missing_osm_reference,
 coalesce(r.importance,'normal') AS importance, coalesce(r.label_rank,60) AS label_rank, r.building_id
FROM places.place p
LEFT JOIN LATERAL (
 SELECT geom,tags,1 AS priority FROM public.osm_points WHERE p.osm_type='node' AND node_id=p.osm_id
 UNION ALL
 SELECT geom,tags,1 AS priority FROM public.osm_polygons WHERE area_id=CASE WHEN p.osm_type='relation' THEN -p.osm_id ELSE p.osm_id END AND p.osm_type IN ('way','relation')
 UNION ALL
 SELECT geom,tags,2 AS priority FROM public.osm_lines WHERE p.osm_type='way' AND way_id=p.osm_id
 ORDER BY priority LIMIT 1
) raw ON true
LEFT JOIN LATERAL (
 SELECT * FROM basemap.poi_render r WHERE
 r.osm_type=CASE WHEN p.osm_type='node' THEN 'node' ELSE 'area' END
 AND r.osm_id=CASE WHEN p.osm_type='relation' THEN -p.osm_id ELSE p.osm_id END LIMIT 1
) r ON p.origin='osm';
-- Only these deliberate lightweight properties belong in public tiles.
CREATE VIEW basemap.places AS
SELECT id::text AS place_id, display_name, map_category AS category, map_subtype AS subtype,
 origin, missing_osm_reference,
 ARRAY(SELECT department_id::text FROM places.place_department d WHERE d.place_id=r.id ORDER BY department_id) AS department_ids,
 map_geom::geometry(Point,4326) AS geom
FROM places.resolved r WHERE map_geom IS NOT NULL;
-- No geometry and no public grants: this is an authenticated API contract.
CREATE VIEW places.details AS
SELECT id AS place_id, origin, osm_type, osm_id, display_name, (SELECT description FROM places.enrichment e WHERE e.place_id=r.id) AS description, missing_osm_reference,
 coalesce((SELECT jsonb_agg(to_jsonb(i)-'place_id' ORDER BY i.sort_order,i.id) FROM places.image i WHERE i.place_id=r.id),'[]'::jsonb) AS images,
 coalesce((SELECT jsonb_agg(to_jsonb(p)||jsonb_build_object('role',o.role,'office_hours',o.office_hours,'department_ids',ARRAY(SELECT department_id FROM places.person_department pd WHERE pd.person_id=p.id)) ORDER BY p.id) FROM places.occupant o JOIN places.person p ON p.id=o.person_id WHERE o.place_id=r.id),'[]'::jsonb) AS occupants,
 coalesce((SELECT jsonb_agg(to_jsonb(d) ORDER BY d.id) FROM places.place_department pd JOIN places.department d ON d.id=pd.department_id WHERE pd.place_id=r.id),'[]'::jsonb) AS departments
FROM places.resolved r;
