
ALTER TABLE public."prodTerminadoLlave2" ADD COLUMN IF NOT EXISTS no_registro integer;

WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (ORDER BY fecha ASC NULLS FIRST, id ASC) AS rn
  FROM public."prodTerminadoLlave2"
)
UPDATE public."prodTerminadoLlave2" AS t
SET no_registro = ranked.rn
FROM ranked
WHERE t.id = ranked.id
  AND (t.no_registro IS DISTINCT FROM ranked.rn);

CREATE SEQUENCE IF NOT EXISTS public."prodTerminadoLlave2_no_registro_seq";
DO $$
DECLARE
  mx integer;
  cnt bigint;
BEGIN
  SELECT COUNT(*), COALESCE(MAX(no_registro), 0) INTO cnt, mx FROM public."prodTerminadoLlave2";
  IF cnt = 0 THEN
    PERFORM setval('public."prodTerminadoLlave2_no_registro_seq"', 1, false);
  ELSE
    PERFORM setval('public."prodTerminadoLlave2_no_registro_seq"', mx, true);
  END IF;
END $$;

ALTER TABLE public."prodTerminadoLlave2"
  ALTER COLUMN no_registro SET DEFAULT nextval('public."prodTerminadoLlave2_no_registro_seq"');
ALTER TABLE public."prodTerminadoLlave2"
  ALTER COLUMN no_registro SET NOT NULL;
ALTER SEQUENCE public."prodTerminadoLlave2_no_registro_seq" OWNED BY public."prodTerminadoLlave2".no_registro;

ALTER TABLE public."prodTerminadoLlave2" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prodTerminadoLlave2_select_auth" ON public."prodTerminadoLlave2";
DROP POLICY IF EXISTS "prodTerminadoLlave2_insert_auth" ON public."prodTerminadoLlave2";
DROP POLICY IF EXISTS "prodTerminadoLlave2_update_auth" ON public."prodTerminadoLlave2";

CREATE POLICY "prodTerminadoLlave2_select_auth" ON public."prodTerminadoLlave2"
  FOR SELECT TO authenticated
  USING (
    (EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.id = auth.uid()
        AND (
          u.role = 'admin'::text
          OR (u.role = 'capturista'::text AND u.planta = 'llave2'::text)
        )
    ))
  );

CREATE POLICY "prodTerminadoLlave2_insert_auth" ON public."prodTerminadoLlave2"
  FOR INSERT TO authenticated
  WITH CHECK (
    (EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.id = auth.uid()
        AND (
          u.role = 'admin'::text
          OR (u.role = 'capturista'::text AND u.planta = 'llave2'::text)
        )
    ))
  );

CREATE POLICY "prodTerminadoLlave2_update_auth" ON public."prodTerminadoLlave2"
  FOR UPDATE TO authenticated
  USING (
    (EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.id = auth.uid()
        AND (
          u.role = 'admin'::text
          OR (u.role = 'capturista'::text AND u.planta = 'llave2'::text)
        )
    ))
  )
  WITH CHECK (
    (EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.id = auth.uid()
        AND (
          u.role = 'admin'::text
          OR (u.role = 'capturista'::text AND u.planta = 'llave2'::text)
        )
    ))
  );

-- ========================= prodTerminadoPeriferico =========================
ALTER TABLE public."prodTerminadoPeriferico" ADD COLUMN IF NOT EXISTS no_registro integer;

WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (ORDER BY fecha ASC NULLS FIRST, id ASC) AS rn
  FROM public."prodTerminadoPeriferico"
)
UPDATE public."prodTerminadoPeriferico" AS t
SET no_registro = ranked.rn
FROM ranked
WHERE t.id = ranked.id
  AND (t.no_registro IS DISTINCT FROM ranked.rn);

CREATE SEQUENCE IF NOT EXISTS public."prodTerminadoPeriferico_no_registro_seq";
DO $$
DECLARE
  mx integer;
  cnt bigint;
BEGIN
  SELECT COUNT(*), COALESCE(MAX(no_registro), 0) INTO cnt, mx FROM public."prodTerminadoPeriferico";
  IF cnt = 0 THEN
    PERFORM setval('public."prodTerminadoPeriferico_no_registro_seq"', 1, false);
  ELSE
    PERFORM setval('public."prodTerminadoPeriferico_no_registro_seq"', mx, true);
  END IF;
END $$;

ALTER TABLE public."prodTerminadoPeriferico"
  ALTER COLUMN no_registro SET DEFAULT nextval('public."prodTerminadoPeriferico_no_registro_seq"');
ALTER TABLE public."prodTerminadoPeriferico"
  ALTER COLUMN no_registro SET NOT NULL;
ALTER SEQUENCE public."prodTerminadoPeriferico_no_registro_seq" OWNED BY public."prodTerminadoPeriferico".no_registro;

ALTER TABLE public."prodTerminadoPeriferico" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prodTerminadoPeriferico_select_auth" ON public."prodTerminadoPeriferico";
DROP POLICY IF EXISTS "prodTerminadoPeriferico_insert_auth" ON public."prodTerminadoPeriferico";
DROP POLICY IF EXISTS "prodTerminadoPeriferico_update_auth" ON public."prodTerminadoPeriferico";

CREATE POLICY "prodTerminadoPeriferico_select_auth" ON public."prodTerminadoPeriferico"
  FOR SELECT TO authenticated
  USING (
    (EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.id = auth.uid()
        AND (
          u.role = 'admin'::text
          OR (u.role = 'capturista'::text AND u.planta = 'periferico'::text)
        )
    ))
  );

CREATE POLICY "prodTerminadoPeriferico_insert_auth" ON public."prodTerminadoPeriferico"
  FOR INSERT TO authenticated
  WITH CHECK (
    (EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.id = auth.uid()
        AND (
          u.role = 'admin'::text
          OR (u.role = 'capturista'::text AND u.planta = 'periferico'::text)
        )
    ))
  );

CREATE POLICY "prodTerminadoPeriferico_update_auth" ON public."prodTerminadoPeriferico"
  FOR UPDATE TO authenticated
  USING (
    (EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.id = auth.uid()
        AND (
          u.role = 'admin'::text
          OR (u.role = 'capturista'::text AND u.planta = 'periferico'::text)
        )
    ))
  )
  WITH CHECK (
    (EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.id = auth.uid()
        AND (
          u.role = 'admin'::text
          OR (u.role = 'capturista'::text AND u.planta = 'periferico'::text)
        )
    ))
  );

-- ========================= prodTerminadoPerisur =========================
ALTER TABLE public."prodTerminadoPerisur" ADD COLUMN IF NOT EXISTS no_registro integer;

WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (ORDER BY fecha ASC NULLS FIRST, id ASC) AS rn
  FROM public."prodTerminadoPerisur"
)
UPDATE public."prodTerminadoPerisur" AS t
SET no_registro = ranked.rn
FROM ranked
WHERE t.id = ranked.id
  AND (t.no_registro IS DISTINCT FROM ranked.rn);

CREATE SEQUENCE IF NOT EXISTS public."prodTerminadoPerisur_no_registro_seq";
DO $$
DECLARE
  mx integer;
  cnt bigint;
BEGIN
  SELECT COUNT(*), COALESCE(MAX(no_registro), 0) INTO cnt, mx FROM public."prodTerminadoPerisur";
  IF cnt = 0 THEN
    PERFORM setval('public."prodTerminadoPerisur_no_registro_seq"', 1, false);
  ELSE
    PERFORM setval('public."prodTerminadoPerisur_no_registro_seq"', mx, true);
  END IF;
END $$;

ALTER TABLE public."prodTerminadoPerisur"
  ALTER COLUMN no_registro SET DEFAULT nextval('public."prodTerminadoPerisur_no_registro_seq"');
ALTER TABLE public."prodTerminadoPerisur"
  ALTER COLUMN no_registro SET NOT NULL;
ALTER SEQUENCE public."prodTerminadoPerisur_no_registro_seq" OWNED BY public."prodTerminadoPerisur".no_registro;

ALTER TABLE public."prodTerminadoPerisur" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prodTerminadoPerisur_select_auth" ON public."prodTerminadoPerisur";
DROP POLICY IF EXISTS "prodTerminadoPerisur_insert_auth" ON public."prodTerminadoPerisur";
DROP POLICY IF EXISTS "prodTerminadoPerisur_update_auth" ON public."prodTerminadoPerisur";

CREATE POLICY "prodTerminadoPerisur_select_auth" ON public."prodTerminadoPerisur"
  FOR SELECT TO authenticated
  USING (
    (EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.id = auth.uid()
        AND (
          u.role = 'admin'::text
          OR (u.role = 'capturista'::text AND u.planta = 'perisur'::text)
        )
    ))
  );

CREATE POLICY "prodTerminadoPerisur_insert_auth" ON public."prodTerminadoPerisur"
  FOR INSERT TO authenticated
  WITH CHECK (
    (EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.id = auth.uid()
        AND (
          u.role = 'admin'::text
          OR (u.role = 'capturista'::text AND u.planta = 'perisur'::text)
        )
    ))
  );

CREATE POLICY "prodTerminadoPerisur_update_auth" ON public."prodTerminadoPerisur"
  FOR UPDATE TO authenticated
  USING (
    (EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.id = auth.uid()
        AND (
          u.role = 'admin'::text
          OR (u.role = 'capturista'::text AND u.planta = 'perisur'::text)
        )
    ))
  )
  WITH CHECK (
    (EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.id = auth.uid()
        AND (
          u.role = 'admin'::text
          OR (u.role = 'capturista'::text AND u.planta = 'perisur'::text)
        )
    ))
  );
