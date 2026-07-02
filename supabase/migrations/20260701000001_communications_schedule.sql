-- Add scheduled_for to communications table
ALTER TABLE public.communications 
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

-- Add UPDATE policy for admins so they could theoretically edit communications
CREATE POLICY "Communications can be updated by admins" ON public.communications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('SYSADMIN', 'CHURCH_ADMIN', 'SUPPORT_ADMIN')
        )
    );

CREATE POLICY "Communications can be deleted by admins" ON public.communications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('SYSADMIN', 'CHURCH_ADMIN', 'SUPPORT_ADMIN')
        )
    );

CREATE POLICY "Admins can update user notifications" ON public.user_notifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('SYSADMIN', 'CHURCH_ADMIN', 'SUPPORT_ADMIN')
        )
    );

CREATE POLICY "Admins can delete user notifications" ON public.user_notifications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('SYSADMIN', 'CHURCH_ADMIN', 'SUPPORT_ADMIN')
        )
    );
