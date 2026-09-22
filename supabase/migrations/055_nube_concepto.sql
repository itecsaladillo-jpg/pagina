-- Agrega columna nube_concepto para que el operador configure el concepto de la charla
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS nube_concepto TEXT DEFAULT '';
