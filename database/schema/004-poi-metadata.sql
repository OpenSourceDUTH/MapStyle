-- Editorial data survives OSM refreshes because it is keyed separately from
-- imported OSM rows. Keep image URLs and other application fields here.
CREATE TABLE IF NOT EXISTS public.poi_metadata (
    osm_type text NOT NULL,
    osm_id bigint NOT NULL,
    image_url text,
    image_credit text,
    website text,
    wikidata text,
    wikipedia text,
    phone text,
    opening_hours text,
    description text,
    extra jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (osm_type, osm_id),
    CHECK (osm_type IN ('node', 'way', 'relation'))
);

CREATE INDEX IF NOT EXISTS poi_metadata_wikidata_idx
    ON public.poi_metadata (wikidata)
    WHERE wikidata IS NOT NULL;

CREATE OR REPLACE FUNCTION public.touch_poi_metadata_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS poi_metadata_updated_at ON public.poi_metadata;
CREATE TRIGGER poi_metadata_updated_at
BEFORE UPDATE ON public.poi_metadata
FOR EACH ROW EXECUTE FUNCTION public.touch_poi_metadata_updated_at();
