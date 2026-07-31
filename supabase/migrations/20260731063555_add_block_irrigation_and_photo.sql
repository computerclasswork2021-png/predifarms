-- Multi-block land management: irrigation method + cover photo per block
ALTER TABLE public.field_blocks
  ADD COLUMN IF NOT EXISTS irrigation_method TEXT NOT NULL DEFAULT 'rainfed',
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Optional: a small gallery of per-block photos
CREATE TABLE IF NOT EXISTS public.block_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  block_id UUID NOT NULL REFERENCES public.field_blocks(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.block_photos TO authenticated;
GRANT ALL ON public.block_photos TO service_role;
ALTER TABLE public.block_photos ENABLE ROW LEVEL SECURITY;

-- A user may only touch photos of blocks they own
CREATE POLICY "own block photos select" ON public.block_photos
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.field_blocks b WHERE b.id = block_id AND b.user_id = auth.uid()));
CREATE POLICY "own block photos insert" ON public.block_photos
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.field_blocks b WHERE b.id = block_id AND b.user_id = auth.uid()));
CREATE POLICY "own block photos update" ON public.block_photos
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.field_blocks b WHERE b.id = block_id AND b.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.field_blocks b WHERE b.id = block_id AND b.user_id = auth.uid()));
CREATE POLICY "own block photos delete" ON public.block_photos
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.field_blocks b WHERE b.id = block_id AND b.user_id = auth.uid()));
