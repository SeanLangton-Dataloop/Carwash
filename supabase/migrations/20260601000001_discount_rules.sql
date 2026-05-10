-- ============================================================
-- Migration: Add discount_rules app_config key
-- Extends seed_site_defaults to include a default discount rule
-- for new sites, and backfills all existing sites.
-- ============================================================

-- Update seed_site_defaults to also seed discount_rules
CREATE OR REPLACE FUNCTION seed_site_defaults(p_site_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.app_config (site_id, key, value) VALUES
    (
      p_site_id,
      'service_types',
      '[{"name":"Basic Wash","active":true},{"name":"Full Wash","active":true},{"name":"Valet","active":true}]'::jsonb
    ),
    (
      p_site_id,
      'vehicle_types',
      '[{"name":"Car","active":true},{"name":"Van","active":true},{"name":"SUV","active":true},{"name":"Bakkie","active":true},{"name":"Motorcycle","active":true}]'::jsonb
    ),
    (
      p_site_id,
      'price_matrix',
      '{"Basic Wash|Car":80,"Basic Wash|Van":100,"Basic Wash|SUV":100,"Basic Wash|Bakkie":100,"Basic Wash|Motorcycle":60,"Full Wash|Car":150,"Full Wash|Van":200,"Full Wash|SUV":200,"Full Wash|Bakkie":180,"Full Wash|Motorcycle":100,"Valet|Car":350,"Valet|Van":500,"Valet|SUV":500,"Valet|Bakkie":450,"Valet|Motorcycle":200}'::jsonb
    ),
    (
      p_site_id,
      'discount_rules',
      '[{"name":"Pensioner Tuesday","day_of_week":2,"percentage":20,"active":true}]'::jsonb
    )
  ON CONFLICT (site_id, key) DO NOTHING;
END;
$$;

-- Backfill discount_rules for all existing sites that don't have it yet
INSERT INTO public.app_config (site_id, key, value)
SELECT
  id,
  'discount_rules',
  '[{"name":"Pensioner Tuesday","day_of_week":2,"percentage":20,"active":true}]'::jsonb
FROM public.sites
ON CONFLICT (site_id, key) DO NOTHING;
