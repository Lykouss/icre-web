SELECT pol.polname, 
       pol.roles, 
       pol.cmd, 
       pol.qual, 
       pol.with_check 
FROM pg_policy pol 
JOIN pg_class tbl ON pol.polrelid = tbl.oid 
WHERE tbl.relname = 'event_registrations';
