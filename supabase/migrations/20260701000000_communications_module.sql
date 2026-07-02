-- Create communications table
CREATE TABLE IF NOT EXISTS public.communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('INFO', 'WARNING', 'MAINTENANCE', 'ALERT', 'DIRECT_MESSAGE')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    lock_duration_seconds INTEGER DEFAULT 0,
    audience_filter JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES public.profiles(id)
);

-- Create user_notifications table
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    communication_id UUID NOT NULL REFERENCES public.communications(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for communications
CREATE POLICY "Communications are viewable by everyone" ON public.communications
    FOR SELECT USING (true);

CREATE POLICY "Communications can be inserted by admins" ON public.communications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('SYSADMIN', 'CHURCH_ADMIN', 'SUPPORT_ADMIN')
        )
    );

-- Policies for user_notifications
CREATE POLICY "Users can view their own notifications" ON public.user_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.user_notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert user notifications" ON public.user_notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('SYSADMIN', 'CHURCH_ADMIN', 'SUPPORT_ADMIN')
        )
    );

-- Enable Realtime for user_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
