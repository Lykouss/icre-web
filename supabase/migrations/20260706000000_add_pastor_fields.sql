ALTER TABLE pastors ADD COLUMN is_president boolean DEFAULT false;
ALTER TABLE pastors ADD COLUMN spouse_id uuid REFERENCES pastors(id) ON DELETE SET NULL;
