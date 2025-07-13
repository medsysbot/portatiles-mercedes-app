-- Quita restricciones UNIQUE de la tabla empleados_salarios si existen
-- Deja intacta la clave primaria 'id'

ALTER TABLE empleados_salarios
    DROP CONSTRAINT IF EXISTS empleados_salarios_dni_cuit_cuil_key;

ALTER TABLE empleados_salarios
    DROP CONSTRAINT IF EXISTS empleados_salarios_dni_cuit_cuil_fecha_key;

ALTER TABLE empleados_salarios
    DROP CONSTRAINT IF EXISTS empleados_salarios_dni_cuit_cuil_monto_key;
