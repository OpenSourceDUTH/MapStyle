-- Reconstructed from the live raw table contract and archived Kavala extract.
local schema = os.getenv('MAPSTYLE_OSM_SCHEMA') or 'public'

local function table_for(name, kind, id, geometry)
    return osm2pgsql.define_table{
        name = name, schema = schema, ids = {type = kind, id_column = id},
        columns = {
            {column = 'tags', type = 'jsonb'},
            {column = 'geom', type = geometry, projection = 4326, not_null = true}
        }
    }
end
local points = table_for('osm_points', 'node', 'node_id', 'point')
local lines = table_for('osm_lines', 'way', 'way_id', 'linestring')
local polygons = table_for('osm_polygons', 'area', 'area_id', 'geometry')
function osm2pgsql.process_node(o)
    if next(o.tags) then points:insert{tags = o.tags, geom = o:as_point()} end
end
function osm2pgsql.process_way(o)
    if not next(o.tags) then return end
    if o.is_closed and o.tags.area ~= 'no' then
        polygons:insert{tags = o.tags, geom = o:as_polygon()}
    else
        lines:insert{tags = o.tags, geom = o:as_linestring()}
    end
end
function osm2pgsql.process_relation(o)
    if o.tags.type == 'multipolygon' or o.tags.type == 'boundary' then
        polygons:insert{tags = o.tags, geom = o:as_multipolygon()}
    end
end
