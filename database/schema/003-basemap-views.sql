CREATE VIEW basemap.area_labels AS
 SELECT osm_polygons.area_id,
    (osm_polygons.tags ->> 'name'::text) AS name,
    (osm_polygons.tags ->> 'name:el'::text) AS name_el,
    (osm_polygons.tags ->> 'name:en'::text) AS name_en,
    (osm_polygons.tags ->> 'building'::text) AS building,
    (osm_polygons.tags ->> 'amenity'::text) AS amenity,
    (osm_polygons.tags ->> 'landuse'::text) AS landuse,
    (osm_polygons.tags ->> 'leisure'::text) AS leisure,
    (osm_polygons.tags ->> 'tourism'::text) AS tourism,
    (osm_polygons.tags ->> 'historic'::text) AS historic,
    osm_polygons.tags,
    public.st_pointonsurface(osm_polygons.geom) AS geom
   FROM public.osm_polygons
  WHERE ((osm_polygons.tags ? 'name'::text) AND ((osm_polygons.tags ? 'building'::text) OR (osm_polygons.tags ? 'amenity'::text) OR (osm_polygons.tags ? 'landuse'::text) OR (osm_polygons.tags ? 'leisure'::text) OR (osm_polygons.tags ? 'tourism'::text) OR (osm_polygons.tags ? 'historic'::text)));


--
CREATE VIEW basemap.barrier_points AS
 SELECT osm_points.node_id,
    (osm_points.tags ->> 'barrier'::text) AS barrier,
    (osm_points.tags ->> 'entrance'::text) AS entrance,
    (osm_points.tags ->> 'access'::text) AS access,
    (osm_points.tags ->> 'foot'::text) AS foot,
    (osm_points.tags ->> 'bicycle'::text) AS bicycle,
    (osm_points.tags ->> 'motor_vehicle'::text) AS motor_vehicle,
    (osm_points.tags ->> 'locked'::text) AS locked,
    (osm_points.tags ->> 'opening_hours'::text) AS opening_hours,
    (osm_points.tags ->> 'name'::text) AS name,
    (osm_points.tags ->> 'name:el'::text) AS name_el,
    (osm_points.tags ->> 'name:en'::text) AS name_en,
    osm_points.tags,
    osm_points.geom
   FROM public.osm_points
  WHERE ((osm_points.tags ? 'barrier'::text) OR (osm_points.tags ? 'entrance'::text));


--
CREATE VIEW basemap.barriers AS
 SELECT osm_lines.way_id,
    (osm_lines.tags ->> 'barrier'::text) AS barrier,
    (osm_lines.tags ->> 'height'::text) AS height,
    (osm_lines.tags ->> 'width'::text) AS width,
    (osm_lines.tags ->> 'material'::text) AS material,
    (osm_lines.tags ->> 'colour'::text) AS colour,
    (osm_lines.tags ->> 'access'::text) AS access,
    (osm_lines.tags ->> 'foot'::text) AS foot,
    (osm_lines.tags ->> 'bicycle'::text) AS bicycle,
    (osm_lines.tags ->> 'motor_vehicle'::text) AS motor_vehicle,
    (osm_lines.tags ->> 'layer'::text) AS layer,
    (osm_lines.tags ->> 'name'::text) AS name,
    (osm_lines.tags ->> 'name:el'::text) AS name_el,
    (osm_lines.tags ->> 'name:en'::text) AS name_en,
    osm_lines.tags,
    osm_lines.geom
   FROM public.osm_lines
  WHERE (osm_lines.tags ? 'barrier'::text);


--
CREATE VIEW basemap.land AS
 SELECT osm_polygons.area_id,
    (osm_polygons.tags ->> 'landuse'::text) AS landuse,
    (osm_polygons.tags ->> 'natural'::text) AS "natural",
    (osm_polygons.tags ->> 'leisure'::text) AS leisure,
    (osm_polygons.tags ->> 'amenity'::text) AS amenity,
    (osm_polygons.tags ->> 'tourism'::text) AS tourism,
    (osm_polygons.tags ->> 'name'::text) AS name,
    (osm_polygons.tags ->> 'name:el'::text) AS name_el,
    (osm_polygons.tags ->> 'name:en'::text) AS name_en,
    (osm_polygons.tags ->> 'surface'::text) AS surface,
    (osm_polygons.tags ->> 'leaf_type'::text) AS leaf_type,
    (osm_polygons.tags ->> 'leaf_cycle'::text) AS leaf_cycle,
    osm_polygons.tags,
    osm_polygons.geom
   FROM public.osm_polygons
  WHERE ((osm_polygons.tags ? 'landuse'::text) OR ((osm_polygons.tags ->> 'natural'::text) = ANY (ARRAY['wood'::text, 'scrub'::text, 'grassland'::text, 'heath'::text, 'sand'::text, 'beach'::text, 'bare_rock'::text, 'scree'::text, 'shingle'::text, 'wetland'::text])) OR ((osm_polygons.tags ->> 'leisure'::text) = ANY (ARRAY['park'::text, 'garden'::text, 'pitch'::text, 'playground'::text, 'track'::text, 'bleachers'::text, 'golf_course'::text, 'nature_reserve'::text])));


--
CREATE VIEW basemap.bleacher_rows AS
 WITH bleachers AS (
         SELECT land.area_id,
            public.st_transform(land.geom, 2100) AS geom_m
           FROM basemap.land
          WHERE (land.leisure = 'bleachers'::text)
        ), rectangles AS (
         SELECT bleachers.area_id,
            bleachers.geom_m,
            public.st_exteriorring(public.st_orientedenvelope(bleachers.geom_m)) AS rect
           FROM bleachers
        ), corners AS (
         SELECT rectangles.area_id,
            rectangles.geom_m,
            public.st_pointn(rectangles.rect, 1) AS p1,
            public.st_pointn(rectangles.rect, 2) AS p2,
            public.st_pointn(rectangles.rect, 3) AS p3
           FROM rectangles
        ), orientation AS (
         SELECT corners.area_id,
            corners.geom_m,
            public.st_centroid(corners.geom_m) AS center,
                CASE
                    WHEN (public.st_distance(corners.p1, corners.p2) >= public.st_distance(corners.p2, corners.p3)) THEN public.st_azimuth(corners.p1, corners.p2)
                    ELSE public.st_azimuth(corners.p2, corners.p3)
                END AS angle
           FROM corners
        ), rotated AS (
         SELECT orientation.area_id,
            orientation.center,
            orientation.angle,
            public.st_rotate(orientation.geom_m, (- orientation.angle), orientation.center) AS geom_r
           FROM orientation
        ), bounds AS (
         SELECT rotated.area_id,
            rotated.center,
            rotated.angle,
            rotated.geom_r,
            public.st_xmin((public.box2d(rotated.geom_r))::public.box3d) AS xmin,
            public.st_xmax((public.box2d(rotated.geom_r))::public.box3d) AS xmax,
            public.st_ymin((public.box2d(rotated.geom_r))::public.box3d) AS ymin,
            public.st_ymax((public.box2d(rotated.geom_r))::public.box3d) AS ymax
           FROM rotated
        ), rows AS (
         SELECT b.area_id,
            b.center,
            b.angle,
            b.geom_r,
            b.xmin,
            b.xmax,
            b.ymin,
            b.ymax,
            (y.y)::double precision AS row_y
           FROM (bounds b
             CROSS JOIN LATERAL generate_series(((b.ymin + (0.6)::double precision))::numeric, ((b.ymax - (0.6)::double precision))::numeric, 0.85) y(y))
        ), clipped AS (
         SELECT rows.area_id,
            rows.center,
            rows.angle,
            public.st_collectionextract(public.st_intersection(rows.geom_r, public.st_setsrid(public.st_makeline(public.st_makepoint((rows.xmin - (2)::double precision), rows.row_y), public.st_makepoint((rows.xmax + (2)::double precision), rows.row_y)), 2100)), 2) AS row_geom
           FROM rows
        )
 SELECT clipped.area_id,
    row_number() OVER (PARTITION BY clipped.area_id ORDER BY (public.st_ymin((public.box2d(clipped.row_geom))::public.box3d))) AS row_no,
    public.st_transform(public.st_rotate(clipped.row_geom, clipped.angle, clipped.center), 4326) AS geom
   FROM clipped
  WHERE (NOT public.st_isempty(clipped.row_geom));


--
CREATE VIEW basemap.buildings AS
 SELECT osm_polygons.area_id,
    (osm_polygons.tags ->> 'building'::text) AS building,
    (osm_polygons.tags ->> 'building:part'::text) AS building_part,
    (osm_polygons.tags ->> 'building:use'::text) AS building_use,
    (osm_polygons.tags ->> 'name'::text) AS name,
    (osm_polygons.tags ->> 'name:el'::text) AS name_el,
    (osm_polygons.tags ->> 'name:en'::text) AS name_en,
    (osm_polygons.tags ->> 'amenity'::text) AS amenity,
    (osm_polygons.tags ->> 'office'::text) AS office,
    (osm_polygons.tags ->> 'shop'::text) AS shop,
    (osm_polygons.tags ->> 'tourism'::text) AS tourism,
    (osm_polygons.tags ->> 'historic'::text) AS historic,
    (osm_polygons.tags ->> 'building:levels'::text) AS levels,
    (osm_polygons.tags ->> 'building:min_level'::text) AS min_level,
    (osm_polygons.tags ->> 'height'::text) AS height,
    (osm_polygons.tags ->> 'min_height'::text) AS min_height,
    (osm_polygons.tags ->> 'roof:shape'::text) AS roof_shape,
    (osm_polygons.tags ->> 'roof:levels'::text) AS roof_levels,
    (osm_polygons.tags ->> 'roof:height'::text) AS roof_height,
    (osm_polygons.tags ->> 'roof:direction'::text) AS roof_direction,
    (osm_polygons.tags ->> 'roof:orientation'::text) AS roof_orientation,
    (osm_polygons.tags ->> 'roof:material'::text) AS roof_material,
    (osm_polygons.tags ->> 'roof:colour'::text) AS roof_colour,
    (osm_polygons.tags ->> 'building:material'::text) AS building_material,
    (osm_polygons.tags ->> 'building:colour'::text) AS building_colour,
    (osm_polygons.tags ->> 'addr:housenumber'::text) AS housenumber,
    (osm_polygons.tags ->> 'addr:street'::text) AS street,
    osm_polygons.tags,
    osm_polygons.geom
   FROM public.osm_polygons
  WHERE ((osm_polygons.tags ? 'building'::text) OR (osm_polygons.tags ? 'building:part'::text));


--
CREATE VIEW basemap.building_labels AS
 SELECT buildings.area_id,
    COALESCE(buildings.name_el, buildings.name, buildings.name_en) AS display_name,
    buildings.building,
    buildings.amenity,
    public.st_pointonsurface(buildings.geom) AS geom
   FROM basemap.buildings
  WHERE (COALESCE(buildings.name_el, buildings.name, buildings.name_en) IS NOT NULL);


--
CREATE VIEW basemap.coastline AS
 SELECT osm_lines.way_id,
    (osm_lines.tags ->> 'name'::text) AS name,
    (osm_lines.tags ->> 'name:el'::text) AS name_el,
    (osm_lines.tags ->> 'name:en'::text) AS name_en,
    osm_lines.tags,
    osm_lines.geom
   FROM public.osm_lines
  WHERE ((osm_lines.tags ->> 'natural'::text) = 'coastline'::text);


--
CREATE MATERIALIZED VIEW basemap.road_surfaces AS
 WITH source AS (
         SELECT osm_lines.way_id,
            (osm_lines.tags ->> 'highway'::text) AS highway,
            (osm_lines.tags ->> 'service'::text) AS service,
            (osm_lines.tags ->> 'surface'::text) AS surface,
                CASE
                    WHEN ("substring"((osm_lines.tags ->> 'width'::text), '([0-9]+[.]?[0-9]*)'::text) IS NOT NULL) THEN ("substring"((osm_lines.tags ->> 'width'::text), '([0-9]+[.]?[0-9]*)'::text))::double precision
                    ELSE NULL::double precision
                END AS explicit_width_m,
                CASE
                    WHEN ((osm_lines.tags ->> 'lanes'::text) ~ '^[0-9]+$'::text) THEN ((osm_lines.tags ->> 'lanes'::text))::integer
                    ELSE NULL::integer
                END AS lane_count,
            osm_lines.geom
           FROM public.osm_lines
          WHERE ((osm_lines.tags ->> 'highway'::text) = ANY (ARRAY['motorway'::text, 'motorway_link'::text, 'primary'::text, 'primary_link'::text, 'secondary'::text, 'secondary_link'::text, 'tertiary'::text, 'tertiary_link'::text, 'residential'::text, 'living_street'::text, 'unclassified'::text, 'service'::text]))
        ), widths AS (
         SELECT source.way_id,
            source.highway,
            source.service,
            source.surface,
            source.explicit_width_m,
            source.lane_count,
            source.geom,
                CASE
                    WHEN (source.highway = 'motorway'::text) THEN 12.0
                    WHEN (source.highway = 'motorway_link'::text) THEN 8.0
                    WHEN (source.highway = 'primary'::text) THEN 9.0
                    WHEN (source.highway = 'primary_link'::text) THEN 7.5
                    WHEN (source.highway = 'secondary'::text) THEN 8.0
                    WHEN (source.highway = 'secondary_link'::text) THEN 7.0
                    WHEN (source.highway = 'tertiary'::text) THEN 7.5
                    WHEN (source.highway = 'tertiary_link'::text) THEN 6.5
                    WHEN (source.highway = 'residential'::text) THEN 6.5
                    WHEN (source.highway = 'living_street'::text) THEN 6.5
                    WHEN (source.highway = 'unclassified'::text) THEN 6.5
                    WHEN ((source.highway = 'service'::text) AND (source.service = 'driveway'::text)) THEN 5.0
                    WHEN ((source.highway = 'service'::text) AND (source.service = 'parking_aisle'::text)) THEN 5.5
                    WHEN (source.highway = 'service'::text) THEN 6.0
                    ELSE 6.0
                END AS class_width_m
           FROM source
        ), resolved AS (
         SELECT widths.way_id,
            widths.highway,
            widths.service,
            widths.surface,
            COALESCE(widths.explicit_width_m, (
                CASE
                    WHEN (widths.lane_count IS NOT NULL) THEN GREATEST(((widths.lane_count)::numeric * 3.25), widths.class_width_m)
                    ELSE NULL::numeric
                END)::double precision, (widths.class_width_m)::double precision) AS width_m,
            widths.geom
           FROM widths
        )
 SELECT resolved.way_id,
    resolved.highway,
    resolved.service,
    resolved.surface,
    resolved.width_m,
    (public.st_multi(public.st_transform(public.st_buffer(public.st_transform(resolved.geom, 2100), (resolved.width_m / (2.0)::double precision), 'endcap=round join=round'::text), 4326)))::public.geometry(MultiPolygon,4326) AS geom
   FROM resolved
  WITH NO DATA;


--
CREATE MATERIALIZED VIEW basemap.crossing_markings AS
 WITH crossings AS (
         SELECT osm_lines.way_id,
            (osm_lines.tags ->> 'crossing'::text) AS crossing,
            (osm_lines.tags ->> 'crossing:markings'::text) AS crossing_markings,
            osm_lines.geom
           FROM public.osm_lines
          WHERE (((osm_lines.tags ->> 'highway'::text) = 'crossing'::text) OR (((osm_lines.tags ->> 'highway'::text) = 'footway'::text) AND ((osm_lines.tags ->> 'footway'::text) = 'crossing'::text)))
        ), pieces AS (
         SELECT c.way_id,
            c.crossing,
            c.crossing_markings,
            public.st_intersection(c.geom, r.geom) AS geom
           FROM (crossings c
             JOIN basemap.road_surfaces r ON (public.st_intersects(c.geom, r.geom)))
        ), merged AS (
         SELECT pieces.way_id,
            pieces.crossing,
            pieces.crossing_markings,
            public.st_unaryunion(public.st_collect(pieces.geom)) AS geom
           FROM pieces
          GROUP BY pieces.way_id, pieces.crossing, pieces.crossing_markings
        ), cleaned AS (
         SELECT merged.way_id,
            merged.crossing,
            merged.crossing_markings,
            public.st_collectionextract(merged.geom, 2) AS geom
           FROM merged
        )
 SELECT cleaned.way_id,
    cleaned.crossing,
    cleaned.crossing_markings,
    (public.st_multi(cleaned.geom))::public.geometry(MultiLineString,4326) AS geom
   FROM cleaned
  WHERE (NOT public.st_isempty(cleaned.geom))
  WITH NO DATA;


--
CREATE VIEW basemap.transportation AS
 SELECT osm_lines.way_id,
    (osm_lines.tags ->> 'highway'::text) AS highway,
    (osm_lines.tags ->> 'railway'::text) AS railway,
    (osm_lines.tags ->> 'name'::text) AS name,
    (osm_lines.tags ->> 'name:el'::text) AS name_el,
    (osm_lines.tags ->> 'name:en'::text) AS name_en,
    (osm_lines.tags ->> 'ref'::text) AS ref,
    (osm_lines.tags ->> 'surface'::text) AS surface,
    (osm_lines.tags ->> 'lanes'::text) AS lanes,
    (osm_lines.tags ->> 'width'::text) AS width,
    (osm_lines.tags ->> 'maxspeed'::text) AS maxspeed,
    (osm_lines.tags ->> 'oneway'::text) AS oneway,
    (osm_lines.tags ->> 'bridge'::text) AS bridge,
    (osm_lines.tags ->> 'tunnel'::text) AS tunnel,
    (osm_lines.tags ->> 'layer'::text) AS layer,
    (osm_lines.tags ->> 'service'::text) AS service,
    (osm_lines.tags ->> 'access'::text) AS access,
    (osm_lines.tags ->> 'foot'::text) AS foot,
    (osm_lines.tags ->> 'bicycle'::text) AS bicycle,
    (osm_lines.tags ->> 'footway'::text) AS footway,
    (osm_lines.tags ->> 'sidewalk'::text) AS sidewalk,
    (osm_lines.tags ->> 'sidewalk:left'::text) AS sidewalk_left,
    (osm_lines.tags ->> 'sidewalk:right'::text) AS sidewalk_right,
    (osm_lines.tags ->> 'crossing'::text) AS crossing,
    (osm_lines.tags ->> 'crossing:markings'::text) AS crossing_markings,
    (osm_lines.tags ->> 'kerb'::text) AS kerb,
    osm_lines.geom
   FROM public.osm_lines
  WHERE ((osm_lines.tags ? 'highway'::text) OR (osm_lines.tags ? 'railway'::text));


--
CREATE VIEW basemap.named_road_surfaces AS
 SELECT r.way_id,
    md5(COALESCE(NULLIF(t.name_el, ''::text), NULLIF(t.name, ''::text), NULLIF(t.name_en, ''::text))) AS road_id,
    COALESCE(NULLIF(t.name_el, ''::text), NULLIF(t.name, ''::text), NULLIF(t.name_en, ''::text)) AS display_name,
    t.name,
    t.name_el,
    t.name_en,
    t.ref,
    r.highway,
    r.service,
    r.surface,
    r.width_m,
    r.geom
   FROM (basemap.road_surfaces r
     JOIN basemap.transportation t ON ((t.way_id = r.way_id)))
  WHERE (COALESCE(NULLIF(t.name_el, ''::text), NULLIF(t.name, ''::text), NULLIF(t.name_en, ''::text)) IS NOT NULL);


--
CREATE VIEW basemap.named_roads AS
 WITH named AS (
         SELECT transportation.way_id,
            transportation.highway,
            transportation.ref,
            transportation.name,
            transportation.name_el,
            transportation.name_en,
            COALESCE(NULLIF(transportation.name_el, ''::text), NULLIF(transportation.name, ''::text), NULLIF(transportation.name_en, ''::text)) AS display_name,
            transportation.geom
           FROM basemap.transportation
          WHERE (COALESCE(NULLIF(transportation.name_el, ''::text), NULLIF(transportation.name, ''::text), NULLIF(transportation.name_en, ''::text)) IS NOT NULL)
        ), grouped AS (
         SELECT named.display_name,
            min(named.name) AS name,
            min(named.name_el) AS name_el,
            min(named.name_en) AS name_en,
            min(named.ref) AS ref,
            md5(named.display_name) AS road_id,
            public.st_linemerge(public.st_collect(named.geom)) AS geom
           FROM named
          GROUP BY named.display_name
        )
 SELECT grouped.road_id,
    grouped.display_name,
    grouped.name,
    grouped.name_el,
    grouped.name_en,
    grouped.ref,
    (public.st_multi(public.st_collectionextract(grouped.geom, 2)))::public.geometry(MultiLineString,4326) AS geom
   FROM grouped
  WHERE (NOT public.st_isempty(grouped.geom));


--
CREATE VIEW basemap.place_labels AS
 SELECT osm_points.node_id,
    (osm_points.tags ->> 'place'::text) AS place,
    (osm_points.tags ->> 'name'::text) AS name,
    (osm_points.tags ->> 'name:el'::text) AS name_el,
    (osm_points.tags ->> 'name:en'::text) AS name_en,
    (osm_points.tags ->> 'population'::text) AS population,
    osm_points.geom
   FROM public.osm_points
  WHERE ((osm_points.tags ? 'place'::text) AND (osm_points.tags ? 'name'::text));


--
CREATE VIEW basemap.poi AS
 SELECT 'node'::text AS osm_type,
    osm_points.node_id AS osm_id,
    (osm_points.tags ->> 'name'::text) AS name,
    (osm_points.tags ->> 'name:el'::text) AS name_el,
    (osm_points.tags ->> 'name:en'::text) AS name_en,
    (osm_points.tags ->> 'amenity'::text) AS amenity,
    (osm_points.tags ->> 'shop'::text) AS shop,
    (osm_points.tags ->> 'tourism'::text) AS tourism,
    (osm_points.tags ->> 'leisure'::text) AS leisure,
    (osm_points.tags ->> 'historic'::text) AS historic,
    (osm_points.tags ->> 'office'::text) AS office,
    (osm_points.tags ->> 'craft'::text) AS craft,
    (osm_points.tags ->> 'healthcare'::text) AS healthcare,
    (osm_points.tags ->> 'highway'::text) AS highway,
    (osm_points.tags ->> 'public_transport'::text) AS public_transport,
    (osm_points.tags ->> 'railway'::text) AS railway,
    (osm_points.tags ->> 'bus'::text) AS bus,
    (osm_points.tags ->> 'operator'::text) AS operator,
    (osm_points.tags ->> 'brand'::text) AS brand,
    (osm_points.tags ->> 'website'::text) AS website,
    (osm_points.tags ->> 'phone'::text) AS phone,
    (osm_points.tags ->> 'opening_hours'::text) AS opening_hours,
    (osm_points.tags ->> 'addr:housenumber'::text) AS housenumber,
    (osm_points.tags ->> 'addr:street'::text) AS street,
    osm_points.tags,
    osm_points.geom
   FROM public.osm_points
  WHERE ((osm_points.tags ? 'amenity'::text) OR (osm_points.tags ? 'shop'::text) OR (osm_points.tags ? 'tourism'::text) OR (osm_points.tags ? 'leisure'::text) OR (osm_points.tags ? 'historic'::text) OR (osm_points.tags ? 'office'::text) OR (osm_points.tags ? 'craft'::text) OR (osm_points.tags ? 'healthcare'::text) OR (osm_points.tags ? 'public_transport'::text) OR (osm_points.tags ? 'railway'::text) OR ((osm_points.tags ->> 'highway'::text) = 'bus_stop'::text))
UNION ALL
 SELECT 'area'::text AS osm_type,
    osm_polygons.area_id AS osm_id,
    (osm_polygons.tags ->> 'name'::text) AS name,
    (osm_polygons.tags ->> 'name:el'::text) AS name_el,
    (osm_polygons.tags ->> 'name:en'::text) AS name_en,
    (osm_polygons.tags ->> 'amenity'::text) AS amenity,
    (osm_polygons.tags ->> 'shop'::text) AS shop,
    (osm_polygons.tags ->> 'tourism'::text) AS tourism,
    (osm_polygons.tags ->> 'leisure'::text) AS leisure,
    (osm_polygons.tags ->> 'historic'::text) AS historic,
    (osm_polygons.tags ->> 'office'::text) AS office,
    (osm_polygons.tags ->> 'craft'::text) AS craft,
    (osm_polygons.tags ->> 'healthcare'::text) AS healthcare,
    NULL::text AS highway,
    NULL::text AS public_transport,
    NULL::text AS railway,
    NULL::text AS bus,
    (osm_polygons.tags ->> 'operator'::text) AS operator,
    (osm_polygons.tags ->> 'brand'::text) AS brand,
    (osm_polygons.tags ->> 'website'::text) AS website,
    (osm_polygons.tags ->> 'phone'::text) AS phone,
    (osm_polygons.tags ->> 'opening_hours'::text) AS opening_hours,
    (osm_polygons.tags ->> 'addr:housenumber'::text) AS housenumber,
    (osm_polygons.tags ->> 'addr:street'::text) AS street,
    osm_polygons.tags,
    public.st_pointonsurface(osm_polygons.geom) AS geom
   FROM public.osm_polygons
  WHERE ((osm_polygons.tags ? 'shop'::text) OR (osm_polygons.tags ? 'tourism'::text) OR (osm_polygons.tags ? 'historic'::text) OR (osm_polygons.tags ? 'office'::text) OR (osm_polygons.tags ? 'craft'::text) OR (osm_polygons.tags ? 'healthcare'::text) OR ((osm_polygons.tags ->> 'amenity'::text) = ANY (ARRAY['school'::text, 'place_of_worship'::text, 'restaurant'::text, 'fuel'::text, 'kindergarten'::text, 'cafe'::text, 'bank'::text, 'car_wash'::text, 'clinic'::text, 'theatre'::text, 'bar'::text, 'library'::text, 'nursing_home'::text, 'cinema'::text, 'harbourmaster'::text, 'courthouse'::text, 'bus_station'::text, 'doctors'::text, 'fire_station'::text, 'townhall'::text, 'university'::text, 'vehicle_inspection'::text, 'police'::text, 'nightclub'::text, 'hospital'::text])));


--
CREATE VIEW basemap.poi_render AS
 WITH classified AS (
         SELECT p.osm_type,
            p.osm_id,
            concat(lower(p.osm_type), ':', (p.osm_id)::text) AS poi_id,
            COALESCE(p.name_el, p.name, p.name_en) AS display_name,
            p.name,
            p.name_el,
            p.name_en,
            p.amenity,
            p.shop,
            p.tourism,
            p.leisure,
            p.historic,
            p.office,
            p.craft,
            p.healthcare,
            p.highway,
            p.public_transport,
            p.railway,
            p.bus,
            p.operator,
            p.brand,
            p.website,
            p.phone,
            p.opening_hours,
            p.housenumber,
            p.street,
                CASE
                    WHEN ((p.public_transport = ANY (ARRAY['platform'::text, 'stop_position'::text, 'station'::text])) OR (p.highway = 'bus_stop'::text) OR (p.railway = ANY (ARRAY['station'::text, 'halt'::text, 'tram_stop'::text]))) THEN 'transport'::text
                    WHEN (p.amenity = ANY (ARRAY['restaurant'::text, 'cafe'::text, 'fast_food'::text, 'bar'::text, 'pub'::text, 'food_court'::text, 'ice_cream'::text])) THEN 'food'::text
                    WHEN ((p.healthcare IS NOT NULL) OR (p.amenity = ANY (ARRAY['hospital'::text, 'clinic'::text, 'doctors'::text, 'dentist'::text, 'pharmacy'::text, 'veterinary'::text]))) THEN 'health'::text
                    WHEN (p.amenity = ANY (ARRAY['school'::text, 'university'::text, 'college'::text, 'kindergarten'::text, 'library'::text, 'language_school'::text, 'music_school'::text])) THEN 'education'::text
                    WHEN (p.shop IS NOT NULL) THEN 'shopping'::text
                    WHEN ((p.tourism IS NOT NULL) OR (p.historic IS NOT NULL)) THEN 'tourism'::text
                    WHEN ((p.office IS NOT NULL) OR (p.craft IS NOT NULL) OR (p.amenity = ANY (ARRAY['bank'::text, 'atm'::text, 'post_office'::text, 'bureau_de_change'::text, 'car_rental'::text, 'car_wash'::text, 'fuel'::text]))) THEN 'service'::text
                    WHEN (p.amenity IS NOT NULL) THEN 'utility'::text
                    WHEN (p.leisure IS NOT NULL) THEN 'leisure'::text
                    ELSE 'other'::text
                END AS category,
            COALESCE(p.amenity, p.shop, p.tourism, p.leisure, p.historic, p.office, p.craft, p.healthcare, p.public_transport, p.highway, p.railway) AS subtype,
                CASE
                    WHEN (p.amenity = ANY (ARRAY['university'::text, 'hospital'::text])) THEN 'major'::text
                    WHEN (p.tourism = ANY (ARRAY['museum'::text, 'attraction'::text])) THEN 'major'::text
                    WHEN (p.historic = ANY (ARRAY['castle'::text, 'fort'::text, 'monument'::text])) THEN 'major'::text
                    WHEN (p.leisure = 'picnic_table'::text) THEN 'minor'::text
                    WHEN (p.amenity = ANY (ARRAY['bench'::text, 'waste_basket'::text, 'drinking_water'::text])) THEN 'minor'::text
                    ELSE 'normal'::text
                END AS importance,
                CASE
                    WHEN (p.amenity = 'university'::text) THEN 10
                    WHEN (p.amenity = 'hospital'::text) THEN 15
                    WHEN (p.historic = ANY (ARRAY['castle'::text, 'fort'::text, 'monument'::text])) THEN 20
                    WHEN (p.tourism = ANY (ARRAY['museum'::text, 'attraction'::text])) THEN 25
                    WHEN (p.amenity = ANY (ARRAY['college'::text, 'school'::text, 'library'::text])) THEN 35
                    WHEN (p.amenity = ANY (ARRAY['clinic'::text, 'doctors'::text, 'pharmacy'::text])) THEN 40
                    WHEN (p.amenity = ANY (ARRAY['restaurant'::text, 'cafe'::text, 'bar'::text, 'pub'::text])) THEN 60
                    WHEN (p.shop IS NOT NULL) THEN 65
                    WHEN (p.leisure = 'picnic_table'::text) THEN 90
                    WHEN (p.amenity = ANY (ARRAY['bench'::text, 'waste_basket'::text, 'drinking_water'::text])) THEN 95
                    ELSE 70
                END AS label_rank,
            p.geom
           FROM basemap.poi p
        ), resolved AS (
         SELECT c.osm_type,
            c.osm_id,
            c.poi_id,
            c.display_name,
            c.name,
            c.name_el,
            c.name_en,
            c.amenity,
            c.shop,
            c.tourism,
            c.leisure,
            c.historic,
            c.office,
            c.craft,
            c.healthcare,
            c.highway,
            c.public_transport,
            c.railway,
            c.bus,
            c.operator,
            c.brand,
            c.website,
            c.phone,
            c.opening_hours,
            c.housenumber,
            c.street,
            c.category,
            c.subtype,
            c.importance,
            c.label_rank,
            c.geom,
            building.area_id AS building_id
           FROM (classified c
             LEFT JOIN LATERAL ( SELECT b.area_id
                   FROM basemap.buildings b
                  WHERE public.st_covers(b.geom, c.geom)
                  ORDER BY
                        CASE
                            WHEN ((c.osm_type = 'area'::text) AND (abs(b.area_id) = abs(c.osm_id))) THEN 0
                            WHEN ((b.building IS NOT NULL) AND (b.building_part IS NULL)) THEN 1
                            ELSE 2
                        END, (public.st_area(public.st_transform(b.geom, 2100)))
                 LIMIT 1) building ON (true))
        )
 SELECT resolved.osm_type,
    resolved.osm_id,
    resolved.poi_id,
    resolved.display_name,
    resolved.name,
    resolved.name_el,
    resolved.name_en,
    resolved.category,
    resolved.subtype,
    resolved.importance,
    resolved.label_rank,
    resolved.amenity,
    resolved.shop,
    resolved.tourism,
    resolved.leisure,
    resolved.historic,
    resolved.office,
    resolved.craft,
    resolved.healthcare,
    resolved.operator,
    resolved.brand,
    resolved.website,
    resolved.phone,
    resolved.opening_hours,
    resolved.housenumber,
    resolved.street,
    resolved.building_id,
    resolved.geom
   FROM resolved
  WHERE ((resolved.category <> 'transport'::text) AND ((resolved.leisure IS NULL) OR (resolved.leisure <> ALL (ARRAY['pitch'::text, 'track'::text, 'bleachers'::text, 'playground'::text]))));


--
CREATE VIEW basemap.running_track_lanes AS
 WITH tracks AS (
         SELECT land.area_id,
            public.st_transform(land.geom, 2100) AS geom_m
           FROM basemap.land
          WHERE ((land.leisure = 'track'::text) AND (((land.tags ->> 'sport'::text) = 'running'::text) OR ((land.tags ->> 'sport'::text) = 'athletics'::text)))
        ), lanes AS (
         SELECT t.area_id,
            lane_no.lane_no,
            public.st_buffer(t.geom_m, ((- ((lane_no.lane_no)::numeric * 1.22)))::double precision, 'join=round'::text) AS lane_polygon
           FROM (tracks t
             CROSS JOIN generate_series(1, 8) lane_no(lane_no))
        ), parts AS (
         SELECT lanes.area_id,
            lanes.lane_no,
            (public.st_dump(lanes.lane_polygon)).geom AS geom
           FROM lanes
          WHERE (NOT public.st_isempty(lanes.lane_polygon))
        )
 SELECT parts.area_id,
    parts.lane_no,
    public.st_transform(public.st_exteriorring(parts.geom), 4326) AS geom
   FROM parts
  WHERE (public.geometrytype(parts.geom) = 'POLYGON'::text);


--
CREATE MATERIALIZED VIEW basemap.sidewalk_surfaces AS
 WITH source AS (
         SELECT t.way_id,
            t.sidewalk,
            r.width_m,
            public.st_transform(t.geom, 2100) AS geom_m
           FROM (basemap.transportation t
             JOIN basemap.road_surfaces r ON ((r.way_id = t.way_id)))
          WHERE (t.sidewalk = ANY (ARRAY['both'::text, 'left'::text, 'right'::text]))
        ), generated AS (
         SELECT source.way_id,
            source.sidewalk,
                CASE
                    WHEN (source.sidewalk = 'both'::text) THEN public.st_difference(public.st_buffer(source.geom_m, ((source.width_m / (2.0)::double precision) + (2.3)::double precision), 'endcap=flat join=round'::text), public.st_buffer(source.geom_m, (source.width_m / (2.0)::double precision), 'endcap=flat join=round'::text))
                    WHEN (source.sidewalk = 'right'::text) THEN public.st_buffer(public.st_offsetcurve(source.geom_m, (- ((source.width_m / (2.0)::double precision) + (1.15)::double precision)), 'join=round'::text), (1.15)::double precision, 'endcap=flat join=round'::text)
                    WHEN (source.sidewalk = 'left'::text) THEN public.st_buffer(public.st_offsetcurve(source.geom_m, ((source.width_m / (2.0)::double precision) + (1.15)::double precision), 'join=round'::text), (1.15)::double precision, 'endcap=flat join=round'::text)
                    ELSE NULL::public.geometry
                END AS geom_m
           FROM source
        ), cleaned AS (
         SELECT generated.way_id,
            generated.sidewalk,
            ST_CollectionExtract(ST_MakeValid(ST_Transform(generated.geom_m, 4326), 'method=structure keepcollapsed=false'), 3) AS geom
           FROM generated
          WHERE (generated.geom_m IS NOT NULL)
        )
 SELECT cleaned.way_id,
    cleaned.sidewalk,
    ST_Multi(cleaned.geom)::geometry(MultiPolygon,4326) AS geom
   FROM cleaned
  WHERE NOT ST_IsEmpty(cleaned.geom)
  WITH NO DATA;


--
CREATE VIEW basemap.transit_stops AS
 SELECT ('node:'::text || (osm_points.node_id)::text) AS stop_id,
    osm_points.node_id AS osm_id,
    COALESCE((osm_points.tags ->> 'name:el'::text), (osm_points.tags ->> 'name'::text)) AS display_name,
    (osm_points.tags ->> 'name'::text) AS name,
    (osm_points.tags ->> 'name:el'::text) AS name_el,
    (osm_points.tags ->> 'name:en'::text) AS name_en,
    (osm_points.tags ->> 'ref'::text) AS ref,
    (osm_points.tags ->> 'network'::text) AS network,
    (osm_points.tags ->> 'operator'::text) AS operator,
    (osm_points.tags ->> 'shelter'::text) AS shelter,
    (osm_points.tags ->> 'bench'::text) AS bench,
    (osm_points.tags ->> 'lit'::text) AS lit,
    (osm_points.tags ->> 'wheelchair'::text) AS wheelchair,
    (osm_points.tags ->> 'public_transport'::text) AS public_transport,
    (osm_points.tags ->> 'highway'::text) AS highway,
    osm_points.geom
   FROM public.osm_points
  WHERE (((osm_points.tags ->> 'public_transport'::text) = 'platform'::text) AND ((osm_points.tags ->> 'highway'::text) = 'bus_stop'::text) AND ((osm_points.tags ->> 'bus'::text) = 'yes'::text));


--
CREATE VIEW basemap.transportation_areas AS
 SELECT osm_polygons.area_id,
    (osm_polygons.tags ->> 'highway'::text) AS highway,
    (osm_polygons.tags ->> 'amenity'::text) AS amenity,
    (osm_polygons.tags ->> 'parking'::text) AS parking,
    (osm_polygons.tags ->> 'service'::text) AS service,
    (osm_polygons.tags ->> 'surface'::text) AS surface,
    (osm_polygons.tags ->> 'access'::text) AS access,
    (osm_polygons.tags ->> 'covered'::text) AS covered,
    (osm_polygons.tags ->> 'capacity'::text) AS capacity,
    (osm_polygons.tags ->> 'capacity:disabled'::text) AS capacity_disabled,
    (osm_polygons.tags ->> 'fee'::text) AS fee,
    (osm_polygons.tags ->> 'name'::text) AS name,
    (osm_polygons.tags ->> 'name:el'::text) AS name_el,
    (osm_polygons.tags ->> 'name:en'::text) AS name_en,
    osm_polygons.tags,
    osm_polygons.geom
   FROM public.osm_polygons
  WHERE (((osm_polygons.tags ->> 'amenity'::text) = 'parking'::text) OR ((osm_polygons.tags ->> 'highway'::text) = ANY (ARRAY['pedestrian'::text, 'service'::text, 'residential'::text, 'unclassified'::text, 'tertiary'::text, 'footway'::text, 'track'::text, 'raceway'::text])));


--
CREATE VIEW basemap.water AS
 SELECT osm_polygons.area_id,
    (osm_polygons.tags ->> 'natural'::text) AS "natural",
    (osm_polygons.tags ->> 'water'::text) AS water,
    (osm_polygons.tags ->> 'waterway'::text) AS waterway,
    (osm_polygons.tags ->> 'landuse'::text) AS landuse,
    (osm_polygons.tags ->> 'name'::text) AS name,
    (osm_polygons.tags ->> 'name:el'::text) AS name_el,
    (osm_polygons.tags ->> 'name:en'::text) AS name_en,
    (osm_polygons.tags ->> 'intermittent'::text) AS intermittent,
    (osm_polygons.tags ->> 'tidal'::text) AS tidal,
    osm_polygons.tags,
    osm_polygons.geom
   FROM public.osm_polygons
  WHERE (((osm_polygons.tags ->> 'natural'::text) = 'water'::text) OR (osm_polygons.tags ? 'water'::text) OR (osm_polygons.tags ? 'waterway'::text) OR ((osm_polygons.tags ->> 'landuse'::text) = ANY (ARRAY['reservoir'::text, 'basin'::text])));


--
CREATE VIEW basemap.waterways AS
 SELECT osm_lines.way_id,
    (osm_lines.tags ->> 'waterway'::text) AS waterway,
    (osm_lines.tags ->> 'name'::text) AS name,
    (osm_lines.tags ->> 'name:el'::text) AS name_el,
    (osm_lines.tags ->> 'name:en'::text) AS name_en,
    (osm_lines.tags ->> 'intermittent'::text) AS intermittent,
    (osm_lines.tags ->> 'tunnel'::text) AS tunnel,
    (osm_lines.tags ->> 'layer'::text) AS layer,
    osm_lines.tags,
    osm_lines.geom
   FROM public.osm_lines
  WHERE (osm_lines.tags ? 'waterway'::text);


--
CREATE VIEW map.kavala_boundary AS
 SELECT osm_polygons.area_id,
    (osm_polygons.tags ->> 'name'::text) AS name,
    (osm_polygons.tags ->> 'name:el'::text) AS name_el,
    (osm_polygons.tags ->> 'name:en'::text) AS name_en,
    (osm_polygons.tags ->> 'admin_level'::text) AS admin_level,
    osm_polygons.tags,
    ST_Multi(osm_polygons.geom)::geometry(MultiPolygon, 4326) AS geom
   FROM public.osm_polygons
  WHERE osm_polygons.area_id = -2346651
UNION ALL
 SELECT area_id, name, name_el, name_en, admin_level, tags, geom
   FROM map.kavala_boundary_source
  WHERE NOT EXISTS (SELECT 1 FROM public.osm_polygons WHERE area_id = -2346651);


--
CREATE VIEW map.aoi AS
 SELECT kavala_boundary.area_id,
    'Kavala mapping AOI'::text AS name,
    ST_Multi(ST_Transform(ST_Buffer(ST_Transform(kavala_boundary.geom, 2100), 5000), 4326))::geometry(MultiPolygon, 4326) AS geom
   FROM map.kavala_boundary;


--

REFRESH MATERIALIZED VIEW basemap.road_surfaces;
REFRESH MATERIALIZED VIEW basemap.crossing_markings;
REFRESH MATERIALIZED VIEW basemap.sidewalk_surfaces;
CREATE INDEX road_surfaces_geom_idx ON basemap.road_surfaces USING gist (geom);
CREATE UNIQUE INDEX road_surfaces_way_idx ON basemap.road_surfaces (way_id);
CREATE INDEX crossing_markings_geom_idx ON basemap.crossing_markings USING gist (geom);
CREATE UNIQUE INDEX crossing_markings_way_idx ON basemap.crossing_markings (way_id);
CREATE INDEX sidewalk_surfaces_geom_idx ON basemap.sidewalk_surfaces USING gist (geom);
CREATE UNIQUE INDEX sidewalk_surfaces_way_idx ON basemap.sidewalk_surfaces (way_id);
