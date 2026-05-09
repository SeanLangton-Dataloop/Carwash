-- ============================================================
-- FUNCTION: seed_site_defaults
-- Inserts default app_config rows for a newly created site.
-- Called automatically by the trg_seed_site_defaults trigger.
-- ============================================================
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
      '{
        "Basic Wash|Car": 80,
        "Basic Wash|Van": 100,
        "Basic Wash|SUV": 100,
        "Basic Wash|Bakkie": 100,
        "Basic Wash|Motorcycle": 60,
        "Full Wash|Car": 150,
        "Full Wash|Van": 200,
        "Full Wash|SUV": 200,
        "Full Wash|Bakkie": 180,
        "Full Wash|Motorcycle": 100,
        "Valet|Car": 350,
        "Valet|Van": 500,
        "Valet|SUV": 500,
        "Valet|Bakkie": 450,
        "Valet|Motorcycle": 200
      }'::jsonb
    )
  ON CONFLICT (site_id, key) DO NOTHING;
END;
$$;

-- ============================================================
-- TRIGGER FUNCTION: on_site_created
-- Fires after every new site row to seed its default config
-- ============================================================
CREATE OR REPLACE FUNCTION on_site_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM seed_site_defaults(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_seed_site_defaults
  AFTER INSERT ON sites
  FOR EACH ROW EXECUTE FUNCTION on_site_created();
