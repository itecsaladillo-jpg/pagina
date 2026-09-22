-- Migración 072: Dar rol de admin a Matias Vidal
UPDATE public.members
SET role = 'admin'
WHERE email = 'matiasvidal11972@gmail.com';
