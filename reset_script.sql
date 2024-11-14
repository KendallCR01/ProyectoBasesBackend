
ALTER SESSION SET "_ORACLE_SCRIPT"=TRUE;

conn super_user/root@localhost/XE;  

-- Eliminar secuencias
DROP SEQUENCE seq_id_curso;
DROP SEQUENCE seq_id_historial_curso;
DROP SEQUENCE seq_id_maquina;
DROP SEQUENCE seq_id_membresia;
DROP SEQUENCE seq_id_rutina;

COMMIT;

-- Eliminar tablas
DROP TABLE historial_curso CASCADE CONSTRAINTS;
DROP TABLE rutinas CASCADE CONSTRAINTS;
DROP TABLE cursos CASCADE CONSTRAINTS;
DROP TABLE trabajador CASCADE CONSTRAINTS;
DROP TABLE maquinas CASCADE CONSTRAINTS;
DROP TABLE membresia CASCADE CONSTRAINTS;
DROP TABLE cliente CASCADE CONSTRAINTS;

--Eliminar tablespace
DROP TABLESPACE gimnasio INCLUDING CONTENTS AND DATAFILES;

-- Eliminar roles
--DROP ROLE instructor;
--DROP ROLE usuario_cliente;
--DROP ROLE soporte;

--conn sys/root@localhost/XE as sysdba;

-- Eliminar usuario
--DROP USER super_user CASCADE;


-- Eliminar auditorías
--ALTER SYSTEM SET audit_trail=NONE SCOPE=SPFILE;

--SHUTDOWN IMMEDIATE;
--STARTUP;