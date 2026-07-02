
CREATE TABLE public.marketing_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'ad_copy',
  content TEXT,
  asset_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_assets TO authenticated;
GRANT ALL ON public.marketing_assets TO service_role;

ALTER TABLE public.marketing_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage marketing assets"
  ON public.marketing_assets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_marketing_assets_updated_at
  BEFORE UPDATE ON public.marketing_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_marketing_assets_campaign ON public.marketing_assets(campaign_id);
CREATE INDEX idx_marketing_assets_kind ON public.marketing_assets(kind);
