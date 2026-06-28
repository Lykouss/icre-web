ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS terms_text text,
ADD COLUMN IF NOT EXISTS accepts_pix boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS accepts_boleto boolean DEFAULT true;
