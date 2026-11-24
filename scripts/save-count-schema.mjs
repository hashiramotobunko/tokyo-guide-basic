import fs from 'node:fs';

const places = JSON.parse(fs.readFileSync(new URL('../data/places.json', import.meta.url), 'utf8'));
const allowedIds = [...new Set(places.map(({ id }) => id))];
const rows = allowedIds.map(id => "  ('" + id.replaceAll("'", "''") + "')").join(',\n');

process.stdout.write(`BEGIN;

CREATE SCHEMA IF NOT EXISTS shakedown_metrics;
REVOKE ALL ON SCHEMA shakedown_metrics FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS shakedown_metrics.place_save_counts (
  place_id text PRIMARY KEY,
  save_count bigint NOT NULL DEFAULT 0 CHECK (save_count >= 0)
);
REVOKE ALL ON shakedown_metrics.place_save_counts FROM PUBLIC, anon, authenticated;

INSERT INTO shakedown_metrics.place_save_counts (place_id) VALUES
${rows}
ON CONFLICT (place_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.record_place_save(p_place_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  UPDATE shakedown_metrics.place_save_counts
  SET save_count = save_count + 1
  WHERE place_id = p_place_id;
$function$;

REVOKE ALL ON FUNCTION public.record_place_save(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_place_save(text) TO anon;
COMMIT;
`);
