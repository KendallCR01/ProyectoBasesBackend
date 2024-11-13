
ALTER SESSION SET "_ORACLE_SCRIPT"=TRUE;

conn sys/root@localhost/XE as sysdba;

CREATE OR REPLACE PROCEDURE crear_usuario (
    p_username         VARCHAR2,
    p_contrasena       VARCHAR2
) AS
BEGIN
    EXECUTE IMMEDIATE 'ALTER SESSION SET "_ORACLE_SCRIPT"=TRUE';

    EXECUTE IMMEDIATE 'CREATE USER ' || p_username || ' IDENTIFIED BY ' || p_contrasena;

    EXECUTE IMMEDIATE 'GRANT CONNECT TO ' || p_username;

    EXECUTE IMMEDIATE 'GRANT usuario_cliente TO ' || p_username;
    
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20002, 'Error al crear usuario: ' || SQLERRM);
END;
/ 


CREATE OR REPLACE PROCEDURE crear_usuario_trabajador (
    p_username         VARCHAR2,
    p_contrasena       VARCHAR2
) AS
BEGIN
    EXECUTE IMMEDIATE 'ALTER SESSION SET "_ORACLE_SCRIPT"=TRUE';

    EXECUTE IMMEDIATE 'CREATE USER ' || p_username || ' IDENTIFIED BY ' || p_contrasena;

    EXECUTE IMMEDIATE 'GRANT CONNECT TO ' || p_username;

    EXECUTE IMMEDIATE 'GRANT instructor TO ' || p_username;

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20002, 'Error al crear usuario: ' || SQLERRM);
END;
/

CREATE TABLESPACE gimnasio
   DATAFILE 'C:\tablespace\gimnasio.dbf' 
   SIZE 100M 
   AUTOEXTEND ON 
   NEXT 10M MAXSIZE UNLIMITED;

CREATE USER super_user IDENTIFIED BY "root"
    DEFAULT TABLESPACE gimnasio
    TEMPORARY TABLESPACE TEMP
    QUOTA UNLIMITED ON USERS;
    
-- Otorgar roles básicos
GRANT DBA TO super_user;


--Aqui lo cambie por esto, solo asi me corrio-----

conn super_user/root@localhost/XE;  


---Aqui tambien dr agrega el tablespace al final creo..----

--A continuacion se realiza la creacion de las tablas justo como 
--se hace en el diagrama entidad-relacion brindado en el documento  
-- nota: en cada se pone "TABLESPACE gimnasio;" para asegurarnos que se cree en ese espacio

CREATE TABLE cliente (
    cedula INT PRIMARY KEY,
    nombre VARCHAR2(30),
    apellido1 VARCHAR2(30),
    apellido2 VARCHAR2(30),
    direccion VARCHAR2(30),
    e_mail VARCHAR2(60),
    fecha_inscripcion DATE,
    celular INT,
    tel_habitacion INT
)TABLESPACE gimnasio; 

CREATE TABLE membresia (
    id INT PRIMARY KEY,
    id_cliente INT,
    monto INT,
    estado VARCHAR2(30),
    fecha DATE,
    FOREIGN KEY (id_cliente) REFERENCES Cliente(cedula)
)TABLESPACE gimnasio; 

CREATE TABLE maquinas (
    id_maquina INT PRIMARY KEY,
    descripcion VARCHAR2(50),
    estado VARCHAR2(30),
    dificultad VARCHAR2(30)
)TABLESPACE gimnasio; 

CREATE TABLE trabajador (
    cod_instructor INT PRIMARY KEY,
    nombre VARCHAR2(30),
    apellido1 VARCHAR2(30),
    apellido2 VARCHAR2(30),
    direccion VARCHAR2(30),
    e_mail VARCHAR2(30),
    tel_cel INT,
    tel_habitacion INT,
    fecha_contratacion DATE,
    rool VARCHAR2(30),
    CONSTRAINT chk_rool CHECK (rool IN ('instructor', 'soporte'))--solo son validos los roles instructor y soporte 
)TABLESPACE gimnasio; 

CREATE TABLE rutinas (
    id_rutina INT PRIMARY KEY,
    cliente INT,
    instructor INT,
    maquina INT,
    fecha DATE,
    horas INT,
    FOREIGN KEY (cliente) REFERENCES Cliente(cedula),
    FOREIGN KEY (instructor) REFERENCES Trabajador(cod_instructor),
    FOREIGN KEY (maquina) REFERENCES Maquinas(id_maquina)
)TABLESPACE gimnasio; 


CREATE TABLE cursos (
    id_curso INT PRIMARY KEY,
    descripcion VARCHAR2(50),
    horario VARCHAR2(50), 
    disponibilidad VARCHAR2(50)
)TABLESPACE gimnasio; 

CREATE TABLE historial_curso (
    id_historial INT PRIMARY KEY,
    cliente INT,
    instructor INT,
    curso INT,
    fecha DATE,
    horas INT,
    FOREIGN KEY (cliente) REFERENCES Cliente(cedula),
    FOREIGN KEY (instructor) REFERENCES Trabajador(cod_instructor),
    FOREIGN KEY (curso) REFERENCES Cursos(id_curso)
)TABLESPACE gimnasio; 

--La linea "ALTER SYSTEM SET audit_trail=db SCOPE=SPFILE;" se utiliza para 
--habilitar las auditorias, este comando cambia el parámetro de configuración "audit_trail",
-- que determina cómo y dónde se almacenarán los registros de auditoría
ALTER SYSTEM SET audit_trail=db SCOPE=SPFILE;



--aqui despues de activar las auditorias, le creamos la auditoria a cada tabla como tal.
AUDIT ALL ON Cliente;
AUDIT ALL ON Membresia;
AUDIT ALL ON Rutinas;
AUDIT ALL ON Maquinas;
AUDIT ALL ON Trabajador;
AUDIT ALL ON Historial_curso;
AUDIT ALL ON Cursos;

--Antes de la creación de usuarios se deben setear el parámetro:
ALTER SESSION SET "_ORACLE_SCRIPT"=TRUE;  

--Creamos el rol del cliente para luego brindarle los privilegios necesarios para la resolucion del sistema.
CREATE ROLE usuario_cliente;

--aqui le damos permisos al rol usuario_cliente con el objetivo de no asignar los roles cada vez que se crea el usuario
--esto tambien es como se debe hacer, ya que de la otra manera no es una buena practica en nuestro script
-- en este caso le damos permisos de insertar y borrar en la tabla cliente al rol usuario_cliente y asi susesivamente
--con las siguientes 6 lineas del script.
GRANT INSERT, DELETE ON cliente TO usuario_cliente;
GRANT SELECT ON cliente TO usuario_cliente;
GRANT SELECT ON cursos TO usuario_cliente;
GRANT UPDATE ON cliente TO usuario_cliente;
GRANT SELECT ON historial_curso TO usuario_cliente;
GRANT CREATE SESSION TO usuario_cliente;

--Creamos el rol del instructor para luego brindarle los privilegios necesarios para la resolucion del sistema.
CREATE ROLE instructor;

-- Asignar permisos al rol 'instructor' para acceder a las tablas necesarias
-- Permisos de solo lectura para visualizar clientes, cursos, rutinas, etc.
GRANT SELECT ON cliente TO instructor;
GRANT SELECT ON cursos TO instructor;
GRANT SELECT ON rutinas TO instructor;
GRANT SELECT ON historial_curso TO instructor;
GRANT INSERT, UPDATE, DELETE ON cliente TO instructor;
GRANT INSERT, UPDATE, DELETE ON Membresia TO instructor;
GRANT INSERT, UPDATE, DELETE ON cursos TO instructor;
GRANT INSERT, UPDATE, DELETE ON rutinas TO instructor;
GRANT INSERT, UPDATE, DELETE ON historial_curso TO instructor;
GRANT CREATE SESSION TO instructor;

-- Crear el rol soporte
CREATE ROLE soporte;
GRANT DBA TO soporte;



--A continuación vamos a crear los triggers, estos se realizan con el objetivo de hacer
--las verificaciones correctas y mandar los errores al FrontEnd, estos se van a realizar
--para cada uno de los inserts, update, delete y select de todas las tablas creadas anteriormente. 

---------------------triggers insert----------------------------------------- 

---------------------trigger Cliente----------------------------------------- 

CREATE OR REPLACE TRIGGER trg_insert_cliente
BEFORE INSERT ON cliente
FOR EACH ROW
DECLARE
    v_existente NUMBER;
BEGIN
    -- Validar si el registro ya existe
    SELECT COUNT(*) INTO v_existente
    FROM cliente
    WHERE cedula = :NEW.cedula;

    IF v_existente > 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'El cliente ya existe.'); -- error si el cliente ya existe 
    ELSE
        DBMS_OUTPUT.PUT_LINE('Información insertada correctamente: Cedula: ' || :NEW.cedula || 
                             ', Nombre: ' || :NEW.nombre || ', Apellido: ' || :NEW.apellido1 || 
                             ', Dirección: ' || :NEW.direccion);--inserta el cliente
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Ocurrió un error inesperado en trg_insert_cliente: ' || SQLERRM);
        RAISE; -- Re-lanzar la excepción
END;
/

---------------------trigger membresia----------------------------------------- 

CREATE OR REPLACE TRIGGER trg_insert_membresia
BEFORE INSERT ON membresia
FOR EACH ROW
DECLARE
    v_existente NUMBER;
    v_cliente_existente NUMBER;
BEGIN
    -- Validar si el registro ya existe
    SELECT COUNT(*) INTO v_existente
    FROM membresia
    WHERE id = :NEW.id;

    IF v_existente > 0 THEN
        RAISE_APPLICATION_ERROR(-20002, 'La membresía ya existe.');
    END IF;

    -- Validar que el cliente exista
    SELECT COUNT(*) INTO v_cliente_existente
    FROM cliente
    WHERE cedula = :NEW.id_cliente;

    IF v_cliente_existente = 0 THEN
        RAISE_APPLICATION_ERROR(-20003, 'El cliente especificado en la membresía no existe.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('Información insertada correctamente: ID Membresía: ' || :NEW.id ||
                             ', Cliente ID: ' || :NEW.id_cliente || ', Monto: ' || :NEW.monto);
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Ocurrió un error inesperado en trg_insert_membresia: ' || SQLERRM);
        RAISE; -- Re-lanzar la excepción
END;
/


---------------------trigger rutinas----------------------------------------- 


CREATE OR REPLACE TRIGGER trg_insert_rutinas
BEFORE INSERT ON rutinas
FOR EACH ROW
DECLARE
    v_existente NUMBER;
    v_cliente_existente NUMBER;
    v_instructor_existente NUMBER;
    v_maquina_existente NUMBER;
BEGIN
    -- Validar si el registro ya existe
    SELECT COUNT(*) INTO v_existente
    FROM rutinas
    WHERE id_rutina = :NEW.id_rutina;

    IF v_existente > 0 THEN
        RAISE_APPLICATION_ERROR(-20004, 'La rutina ya existe.');
    END IF;

    -- Validar que el cliente exista
    SELECT COUNT(*) INTO v_cliente_existente
    FROM cliente
    WHERE cedula = :NEW.cliente;

    IF v_cliente_existente = 0 THEN
        RAISE_APPLICATION_ERROR(-20005, 'El cliente especificado en la rutina no existe.');
    END IF;

    -- Validar que el instructor exista
    SELECT COUNT(*) INTO v_instructor_existente
    FROM trabajador
    WHERE cod_instructor = :NEW.instructor;

    IF v_instructor_existente = 0 THEN
        RAISE_APPLICATION_ERROR(-20006, 'El instructor especificado en la rutina no existe.');
    END IF;

    -- Validar que la máquina exista
    SELECT COUNT(*) INTO v_maquina_existente
    FROM maquinas
    WHERE id_maquina = :NEW.maquina;

    IF v_maquina_existente = 0 THEN
        RAISE_APPLICATION_ERROR(-20007, 'La máquina especificada en la rutina no existe.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('Información insertada correctamente: ID Rutina: ' || :NEW.id_rutina || 
                             ', Cliente: ' || :NEW.cliente || ', Instructor: ' || :NEW.instructor || 
                             ', Maquina: ' || :NEW.maquina);
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Ocurrió un error inesperado en trg_insert_rutinas: ' || SQLERRM);
        RAISE; -- Re-lanzar la excepción
END;
/


---------------------trigger maquinas----------------------------------------- 

CREATE OR REPLACE TRIGGER trg_insert_maquinas
BEFORE INSERT ON maquinas
FOR EACH ROW
DECLARE
    v_existente NUMBER;
BEGIN
    -- Validar si el registro ya existe
    SELECT COUNT(*) INTO v_existente
    FROM maquinas
    WHERE id_maquina = :NEW.id_maquina;

    IF v_existente > 0 THEN
        RAISE_APPLICATION_ERROR(-20008, 'La máquina ya existe.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('Información insertada correctamente: ID Máquina: ' || :NEW.id_maquina || 
                             ', Descripción: ' || :NEW.descripcion || ', Estado: ' || :NEW.estado);
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Ocurrió un error inesperado en trg_insert_maquinas: ' || SQLERRM);
        RAISE; 
END;
/


---------------------trigger trabajador----------------------------------------- 

CREATE OR REPLACE TRIGGER trg_insert_trabajador
BEFORE INSERT ON trabajador
FOR EACH ROW
DECLARE
    v_existente NUMBER;
BEGIN
    -- Validar si el registro ya existe
    SELECT COUNT(*) INTO v_existente
    FROM trabajador
    WHERE cod_instructor = :NEW.cod_instructor;

    IF v_existente > 0 THEN
        RAISE_APPLICATION_ERROR(-20009, 'El trabajador ya existe.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('Información insertada correctamente: Código Instructor: ' || :NEW.cod_instructor || 
                             ', Nombre: ' || :NEW.nombre || ', Apellido: ' || :NEW.apellido1);
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Ocurrió un error inesperado en trg_insert_trabajador: ' || SQLERRM);
        RAISE; -- Re-lanzar la excepción
END;
/


---------------------trigger historial Curso----------------------------------------- 
CREATE OR REPLACE TRIGGER trg_insert_historial_curso
BEFORE INSERT ON historial_curso
FOR EACH ROW
DECLARE
    v_existente NUMBER;
    v_cliente_existente NUMBER;
    v_instructor_existente NUMBER;
    v_curso_existente NUMBER;
BEGIN
    -- Validar si el registro ya existe
    SELECT COUNT(*) INTO v_existente
    FROM historial_curso
    WHERE id_historial = :NEW.id_historial;

    IF v_existente > 0 THEN
        RAISE_APPLICATION_ERROR(-20010, 'El historial de curso ya existe.');
    END IF;

    -- Validar que el cliente exista
    SELECT COUNT(*) INTO v_cliente_existente
    FROM cliente
    WHERE cedula = :NEW.cliente;

    IF v_cliente_existente = 0 THEN
        RAISE_APPLICATION_ERROR(-20011, 'El cliente especificado en el historial no existe.');
    END IF;

    -- Validar que el instructor exista
    SELECT COUNT(*) INTO v_instructor_existente
    FROM trabajador
    WHERE cod_instructor = :NEW.instructor;

    IF v_instructor_existente = 0 THEN
        RAISE_APPLICATION_ERROR(-20012, 'El instructor especificado en el historial no existe.');
    END IF;

    -- Validar que el curso exista
    SELECT COUNT(*) INTO v_curso_existente
    FROM cursos
    WHERE id_curso = :NEW.curso;

    IF v_curso_existente = 0 THEN
        RAISE_APPLICATION_ERROR(-20013, 'El curso especificado en el historial no existe.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('Información insertada correctamente: ID Historial: ' || :NEW.id_historial || 
                             ', Cliente: ' || :NEW.cliente || ', Instructor: ' || :NEW.instructor || 
                             ', Curso: ' || :NEW.curso);
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Ocurrió un error inesperado en trg_insert_historial_curso: ' || SQLERRM);
        RAISE; -- Re-lanzar la excepción
END;
/




---------------------trigger Curso----------------------------------------- 

CREATE OR REPLACE TRIGGER trg_insert_cursos
BEFORE INSERT ON cursos
FOR EACH ROW
DECLARE
    v_existente NUMBER;
BEGIN
    -- Validar si el registro ya existe
    SELECT COUNT(*) INTO v_existente
    FROM cursos
    WHERE id_curso = :NEW.id_curso;

    IF v_existente > 0 THEN
        RAISE_APPLICATION_ERROR(-20014, 'El curso ya existe.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('Información insertada correctamente: ID Curso: ' || :NEW.id_curso || 
                             ', Descripción: ' || :NEW.descripcion);
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Ocurrió un error inesperado en trg_insert_cursos: ' || SQLERRM);
        RAISE; -- Re-lanzar la excepción
END;
/



---------------------triggers update----------------------------------------- 

---------------------triggers cliente----------------------------------------- 

CREATE OR REPLACE TRIGGER trg_update_cliente
BEFORE UPDATE ON cliente
FOR EACH ROW
DECLARE
BEGIN
    -- Validar que el campo de llave primaria no se esté actualizando
    IF :OLD.cedula != :NEW.cedula THEN
        RAISE_APPLICATION_ERROR(-20015, 'No se permite actualizar la cédula del cliente.');
    END IF;

    -- Verificar si el registro a actualizar existe (aunque no debería ser necesario en un UPDATE)
    IF :OLD.cedula IS NULL OR :NEW.cedula IS NULL THEN
        RAISE_APPLICATION_ERROR(-20016, 'El cliente especificado no existe.');
    END IF;

    -- Confirmación de actualización (podrías reemplazar esto con una inserción en una tabla de auditoría)
    -- No puedes usar DBMS_OUTPUT en un trigger de esta forma, así que elimínalo.
    -- En lugar de eso, usa RAISE_APPLICATION_ERROR si es necesario.
END;
/



---------------------triggers membresia----------------------------------------- 

CREATE OR REPLACE TRIGGER trg_update_membresia
BEFORE UPDATE ON membresia
FOR EACH ROW
BEGIN
    -- Validar que no se actualicen las claves primaria y foránea
    IF :OLD.id != :NEW.id THEN
        RAISE_APPLICATION_ERROR(-20017, 'No se permite actualizar el ID de la membresía.');
    ELSIF :OLD.id_cliente != :NEW.id_cliente THEN
        RAISE_APPLICATION_ERROR(-20018, 'No se permite actualizar el ID del cliente en membresía.');
    END IF;

    -- Mensaje opcional de confirmación (se puede quitar)
    -- DBMS_OUTPUT.PUT_LINE('La información de la membresía ha sido actualizada correctamente.');
EXCEPTION
    WHEN OTHERS THEN
        RAISE; -- Re-lanzar la excepción para que sea manejada fuera del trigger
END;
/


---------------------triggers rutinas----------------------------------------- 

CREATE OR REPLACE TRIGGER trg_update_rutinas
BEFORE UPDATE ON rutinas
FOR EACH ROW
DECLARE
BEGIN
    -- Validar que no se actualicen las claves primaria y foráneas
    IF :OLD.id_rutina != :NEW.id_rutina THEN
        RAISE_APPLICATION_ERROR(-20020, 'No se permite actualizar el ID de la rutina.');
    END IF;

    -- No es necesario verificar si la rutina existe porque Oracle no permitirá que se actualice un registro inexistente.

EXCEPTION
    WHEN OTHERS THEN
        -- Re-lanzar la excepción para que sea manejada fuera del trigger
        RAISE;
END;
/




---------------------triggers trabajador----------------------------------------- 

CREATE OR REPLACE TRIGGER trg_update_trabajador
BEFORE UPDATE ON trabajador
FOR EACH ROW
DECLARE
BEGIN
    -- Validar que no se actualice la clave primaria (cod_instructor)
    IF :OLD.cod_instructor != :NEW.cod_instructor THEN
        RAISE_APPLICATION_ERROR(-20025, 'No se permite actualizar el código del instructor.');
    END IF;

    -- Si el registro no existe, Oracle generará un error automáticamente,
    -- por lo que no es necesario realizar la verificación explícita.
    
    -- Si deseas hacer alguna validación adicional, como si el nuevo valor es válido, puedes agregarla aquí.

EXCEPTION
    WHEN OTHERS THEN
        -- Capturar cualquier error y lanzar una excepción personalizada
        RAISE_APPLICATION_ERROR(-20027, 'Ocurrió un error inesperado en trg_update_trabajador: ' || SQLERRM);
END;
/


---------------------triggers historial_curso-----------------------------------------

CREATE OR REPLACE TRIGGER trg_update_historial_curso
BEFORE UPDATE ON historial_curso
FOR EACH ROW
BEGIN
    -- Validar que no se actualicen las claves primaria y foráneas
    IF :OLD.id_historial != :NEW.id_historial THEN
        RAISE_APPLICATION_ERROR(-20027, 'No se permite actualizar el ID del historial.');
    ELSIF :OLD.cliente != :NEW.cliente THEN
        RAISE_APPLICATION_ERROR(-20028, 'No se permite actualizar el cliente en el historial.');
    ELSIF :OLD.instructor != :NEW.instructor THEN
        RAISE_APPLICATION_ERROR(-20029, 'No se permite actualizar el instructor en el historial.');
    ELSIF :OLD.curso != :NEW.curso THEN
        RAISE_APPLICATION_ERROR(-20030, 'No se permite actualizar el curso en el historial.');
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        -- Re-lanzar cualquier excepción para su manejo externo
        RAISE;
END;
/

---------------------triggers cursos----------------------------------------- 


CREATE OR REPLACE TRIGGER trg_update_cursos
BEFORE UPDATE ON cursos
FOR EACH ROW
DECLARE
BEGIN
    -- Validar que no se actualice la clave primaria (id_curso)
    IF :OLD.id_curso != :NEW.id_curso THEN
        RAISE_APPLICATION_ERROR(-20032, 'No se permite actualizar el ID del curso.');
    END IF;

    -- Verificación si el curso a actualizar existe (ya es redundante, ya que Oracle no permitirá actualizar un curso que no existe)
    -- Esto puede ser omitido porque la actualización solo funcionará si el registro existe
    -- Si no existe, se generará un error por la base de datos.

    -- Si quieres realizar alguna acción adicional en caso de éxito, puedes utilizar `DBMS_OUTPUT` en herramientas de depuración.
    -- DBMS_OUTPUT.PUT_LINE('La información del curso ha sido actualizada correctamente.');

EXCEPTION
    WHEN OTHERS THEN
        -- Mensaje de error general para depuración
        DBMS_OUTPUT.PUT_LINE('Ocurrió un error inesperado en trg_update_cursos: ' || SQLERRM);
        RAISE; -- Re-lanzar la excepción para que se maneje fuera del trigger
END;
/

---------------------triggers delete----------------------------------------- 

---------------------triggers cliente----------------------------------------- 

CREATE OR REPLACE TRIGGER trg_delete_cliente
BEFORE DELETE ON cliente
FOR EACH ROW
DECLARE
    v_existente NUMBER;
BEGIN
    -- Verificar si el cliente tiene registros relacionados en la tabla membresia
    SELECT COUNT(*) INTO v_existente
    FROM membresia
    WHERE id_cliente = :OLD.cedula;

    IF v_existente > 0 THEN
        RAISE_APPLICATION_ERROR(-20034, 'No se puede eliminar el cliente porque tiene membresías asociadas.');
    END IF;

    -- Verificar si el cliente tiene registros relacionados en la tabla rutinas
    SELECT COUNT(*) INTO v_existente
    FROM rutinas
    WHERE cliente = :OLD.cedula;

    IF v_existente > 0 THEN
        RAISE_APPLICATION_ERROR(-20035, 'No se puede eliminar el cliente porque tiene rutinas asociadas.');
    END IF;

    -- Verificar si el cliente tiene registros relacionados en la tabla historial_curso
    SELECT COUNT(*) INTO v_existente
    FROM historial_curso
    WHERE cliente = :OLD.cedula;

    IF v_existente > 0 THEN
        RAISE_APPLICATION_ERROR(-20036, 'No se puede eliminar el cliente porque tiene historial de cursos asociados.');
    END IF;

    -- Si el cliente no tiene relaciones, permitir el borrado y mostrar mensaje de éxito
    DBMS_OUTPUT.PUT_LINE('Cliente eliminado con éxito.');
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error al eliminar el cliente: ' || SQLERRM);
        RAISE; -- Re-lanzar la excepción
END;
/


---------------------triggers membresia-----------------------------------------



CREATE OR REPLACE TRIGGER trg_delete_membresia
    BEFORE DELETE ON membresia
    FOR EACH ROW
    BEGIN
        -- El trigger permite la eliminación del registro sin validaciones adicionales.
     -- Si ocurre un error en la eliminación, se captura en el bloque EXCEPTION.
 
      DBMS_OUTPUT.PUT_LINE('La membresía ha sido eliminada correctamente.');
  EXCEPTION
       WHEN OTHERS THEN
          -- Usar RAISE_APPLICATION_ERROR para que el backend pueda capturar el mensaje de error
          RAISE_APPLICATION_ERROR(-20037, 'Error al eliminar la membresía: ' || SQLERRM);
   END trg_delete_membresia;
  /

---------------------triggers rutinas----------------------------------------- 

CREATE OR REPLACE TRIGGER trg_delete_rutinas
BEFORE DELETE ON rutinas
FOR EACH ROW
DECLARE
    v_existente NUMBER;
BEGIN
    -- Verificar si la rutina existe antes de eliminarla
    SELECT COUNT(*) INTO v_existente
    FROM rutinas
    WHERE id_rutina = :OLD.id_rutina;

    IF v_existente = 0 THEN
        RAISE_APPLICATION_ERROR(-20037, 'La rutina que desea eliminar no existe.');
    ELSE
        -- Mensaje de confirmación de eliminación
        DBMS_OUTPUT.PUT_LINE('La rutina ha sido eliminada correctamente.');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error al eliminar la rutina: ' || SQLERRM);
END;
/

---------------------triggers trabajador-----------------------------------------



 CREATE OR REPLACE TRIGGER trg_delete_trabajador
    BEFORE DELETE ON trabajador
    FOR EACH ROW
    DECLARE
       v_rutinas_existente NUMBER;
        v_historial_existente NUMBER;
    BEGIN
        -- Verificar si el trabajador está relacionado en la tabla rutinas
        SELECT COUNT(*) INTO v_rutinas_existente
       FROM rutinas
      WHERE instructor = :OLD.cod_instructor;
 
       IF v_rutinas_existente > 0 THEN
           RAISE_APPLICATION_ERROR(-20038, 'No se puede eliminar el trabajador porque tiene rutinas asociadas.');
      END IF;
 
       -- Verificar si el trabajador está relacionado en la tabla historial_curso
       SELECT COUNT(*) INTO v_historial_existente
      FROM historial_curso
      WHERE instructor = :OLD.cod_instructor;
 
       IF v_historial_existente > 0 THEN
           RAISE_APPLICATION_ERROR(-20039, 'No se puede eliminar el trabajador porque tiene un historial de cursos asociado.');
      END IF;
 
      DBMS_OUTPUT.PUT_LINE('El trabajador ha sido eliminado correctamente.');
  EXCEPTION
       WHEN OTHERS THEN
           DBMS_OUTPUT.PUT_LINE('Error al eliminar el trabajador: ' || SQLERRM);
   END trg_delete_trabajador;
   /



 
---------------------triggers historial_curso----------------------------------------- 

CREATE OR REPLACE TRIGGER trg_delete_historial_curso
    BEFORE DELETE ON historial_curso
    FOR EACH ROW
    DECLARE
    BEGIN
        -- Aquí puedes agregar lógica adicional si necesitas verificar relaciones,
        -- pero omite la consulta de la misma tabla 'historial_curso' para evitar el error de "tabla mutante".
  
       -- Confirmación de eliminación (solo para propósitos de verificación)
      DBMS_OUTPUT.PUT_LINE('El historial de curso ha sido eliminado correctamente.');
 
   EXCEPTION
       WHEN OTHERS THEN
           -- Lanzar un error genérico si ocurre un problema inesperado en el trigger
           RAISE_APPLICATION_ERROR(-20047, 'Error al intentar eliminar el historial de curso: ' || SQLERRM);
  END trg_delete_historial_curso;
  /
--------------------triggers maquina----------------------------------------- 

CREATE OR REPLACE TRIGGER trg_delete_maquina
BEFORE DELETE ON maquinas
FOR EACH ROW
DECLARE
    v_relacionado_rutinas NUMBER := 0;
    v_relacionado_membresia NUMBER := 0;
BEGIN
    -- Verificar si existen registros en 'rutinas' que dependen de esta máquina
    SELECT COUNT(*) INTO v_relacionado_rutinas
    FROM rutinas
    WHERE maquina = :OLD.id_maquina;

    IF v_relacionado_rutinas > 0 THEN
        -- Lanzar error si la máquina está relacionada con registros en la tabla "rutinas"
        RAISE_APPLICATION_ERROR(-20041, 'No se puede eliminar la máquina porque está relacionada con registros en la tabla "rutinas".');
    END IF;

    -- Verificar si existen registros en 'membresia' que dependen de esta máquina
    SELECT COUNT(*) INTO v_relacionado_membresia
    FROM membresia
    WHERE id_cliente = :OLD.id_maquina;

    IF v_relacionado_membresia > 0 THEN
        -- Lanzar error si la máquina está relacionada con registros en la tabla "membresia"
        RAISE_APPLICATION_ERROR(-20042, 'No se puede eliminar la máquina porque está relacionada con registros en la tabla "membresia".');
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        -- Capturar cualquier error inesperado y lanzarlo con un mensaje genérico
        RAISE_APPLICATION_ERROR(-20043, 'Error al intentar eliminar la máquina: ' || SQLERRM);
END trg_delete_maquina;
/





---------------------triggers cursos----------------------------------------- 

CREATE OR REPLACE TRIGGER trg_delete_cursos
    BEFORE DELETE ON cursos
    FOR EACH ROW
    DECLARE
        v_existente NUMBER;
    BEGIN
       -- Verificar si el curso está relacionado en la tabla historial_curso
        SELECT COUNT(*) INTO v_existente
        FROM historial_curso
       WHERE curso = :OLD.id_curso;
 
      IF v_existente > 0 THEN
          -- Lanzar error si el curso está relacionado con registros en "historial_curso"
          RAISE_APPLICATION_ERROR(-20041, 'No se puede eliminar el curso porque tiene un historial de cursos asociado.');
       END IF;
 
   EXCEPTION
     WHEN OTHERS THEN
         -- Capturar cualquier error inesperado y lanzarlo con un mensaje genérico
          RAISE_APPLICATION_ERROR(-20042, 'Error al intentar eliminar el curso: ' || SQLERRM);
   END trg_delete_cursos;
   /


---------------------store procedures----------------------------------------------------------

----------Procedimiento para mostrar la información del cliente por cédula--------------------- 

CREATE OR REPLACE PROCEDURE mostrar_informacion_cliente (
    p_cedula_cliente INT,
    p_cursor OUT SYS_REFCURSOR
) IS
BEGIN
    OPEN p_cursor FOR
        SELECT c.cedula, c.nombre AS nombre_cliente, c.apellido1, c.apellido2, 
               c.direccion, c.e_mail, c.fecha_inscripcion, c.celular, c.tel_habitacion,
               cu.descripcion AS curso, r.id_rutina, t.nombre AS nombre_instructor
        FROM cliente c
        LEFT JOIN historial_curso hc ON c.cedula = hc.cliente
        LEFT JOIN cursos cu ON hc.curso = cu.id_curso
        LEFT JOIN rutinas r ON c.cedula = r.cliente
        LEFT JOIN trabajador t ON r.instructor = t.cod_instructor
        WHERE c.cedula = p_cedula_cliente;
END mostrar_informacion_cliente;
/




-----------------------------función para optener años del trabajador------------------------
--para la reslucion correcta del problema debemos crear una funcion que obtenga los años que tiene de trabajar el instrcutor 
--entonces tomamos la fecha de entrada y se hace la conversion para el correcto resultado. 

CREATE OR REPLACE FUNCTION obtener_anios_trabajo(fecha_contratacion DATE) RETURN NUMBER IS
    v_anios_trabajo NUMBER;
BEGIN
    v_anios_trabajo := FLOOR(MONTHS_BETWEEN(SYSDATE, fecha_contratacion) / 12);
    RETURN v_anios_trabajo;

--La función MONTHS_BETWEEN calcula el número total de meses entre dos fechas.
--SYSDATE es la fecha actual (hoy).
--fecha_contratacion es la fecha en la que el empleado fue contratado.

END obtener_anios_trabajo;
/

--------------Procedimiento para mostrar la información del instructor por nombre--------------
--aqui se usa la funcion anterior para mostrar en especifico los años, ademas se muestra toda la informacion del instructor

CREATE OR REPLACE PROCEDURE mostrar_informacion_instructor (
    p_cod_instructor INT,
    p_cursor OUT SYS_REFCURSOR
) IS
BEGIN
    OPEN p_cursor FOR
        SELECT t.cod_instructor, t.nombre AS nombre_instructor, t.apellido1, t.apellido2, 
               t.direccion, t.e_mail, t.tel_cel, t.tel_habitacion, t.fecha_contratacion, 
               cu.descripcion AS curso, r.id_rutina,
               obtener_anios_trabajo(t.fecha_contratacion) AS anios_trabajo
        FROM trabajador t
        LEFT JOIN rutinas r ON t.cod_instructor = r.instructor
        LEFT JOIN historial_curso hc ON t.cod_instructor = hc.instructor
        LEFT JOIN cursos cu ON hc.curso = cu.id_curso
        WHERE t.cod_instructor = p_cod_instructor;  -- Cambié la condición para que busque por "cod_instructor"
END mostrar_informacion_instructor;
/


-------------------------procedures de insert -------------------------------------
--En esta seccion se crean los procedures para los selects, inserts, deletes y updates, por medio de estos se realizan las peticiones 
--como se pidio en el documento, entonces luego tenemos que darle los permisos dependiendo de cada rol


------------------------------cliente----------------------------------------------

----------------------------insert-------------------------------------------------
CREATE OR REPLACE PROCEDURE insertar_cliente (
    p_cedula           INT,
    p_nombre           VARCHAR2,
    p_apellido1        VARCHAR2,
    p_apellido2        VARCHAR2,
    p_direccion        VARCHAR2,
    p_e_mail           VARCHAR2,
    p_fecha_inscripcion DATE,
    p_celular          INT,
    p_tel_habitacion   INT
) AS
BEGIN
    INSERT INTO cliente (
        cedula, nombre, apellido1, apellido2, direccion, e_mail, 
        fecha_inscripcion, celular, tel_habitacion
    ) VALUES (
        p_cedula, p_nombre, p_apellido1, p_apellido2, p_direccion, 
        p_e_mail, p_fecha_inscripcion, p_celular, p_tel_habitacion
    );

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20001, 'Error al insertar cliente: ' || SQLERRM);
END;
/

----------------------------update--------------------------------------------
CREATE OR REPLACE PROCEDURE actualizar_cliente (
    p_cedula IN cliente.cedula%TYPE,
    p_nombre IN cliente.nombre%TYPE,
    p_apellido1 IN cliente.apellido1%TYPE,
    p_direccion IN cliente.direccion%TYPE,
    p_resultado OUT NUMBER  
) AS
BEGIN
    UPDATE cliente
    SET nombre = p_nombre, 
        apellido1 = p_apellido1, 
        direccion = p_direccion
    WHERE cedula = p_cedula;
    
    IF SQL%ROWCOUNT > 0 THEN
        p_resultado := 1;  -- Se actualizó el cliente
    ELSE
        p_resultado := 0;  -- No se encontró el cliente
    END IF;
    
    COMMIT;
END actualizar_cliente;
/

----------------------------delete--------------------------------------------


CREATE OR REPLACE PROCEDURE eliminar_cliente (
    p_cedula IN cliente.cedula%TYPE
) AS
    v_membresias NUMBER;
    v_rutinas NUMBER;
    v_historial_curso NUMBER;
BEGIN
    -- Verificar si el cliente tiene registros relacionados en la tabla membresia
    SELECT COUNT(*) INTO v_membresias
    FROM membresia
    WHERE id_cliente = p_cedula;

    IF v_membresias > 0 THEN
        RAISE_APPLICATION_ERROR(-20034, 'No se puede eliminar el cliente porque tiene membresías asociadas.');
    END IF;

    -- Verificar si el cliente tiene registros relacionados en la tabla rutinas
    SELECT COUNT(*) INTO v_rutinas
    FROM rutinas
    WHERE cliente = p_cedula;

    IF v_rutinas > 0 THEN
        RAISE_APPLICATION_ERROR(-20035, 'No se puede eliminar el cliente porque tiene rutinas asociadas.');
    END IF;

    -- Verificar si el cliente tiene registros relacionados en la tabla historial_curso
    SELECT COUNT(*) INTO v_historial_curso
    FROM historial_curso
    WHERE cliente = p_cedula;

    IF v_historial_curso > 0 THEN
        RAISE_APPLICATION_ERROR(-20036, 'No se puede eliminar el cliente porque tiene historial de cursos asociados.');
    END IF;

    -- Si no hay registros relacionados, eliminar el cliente
    DELETE FROM cliente
    WHERE cedula = p_cedula;

    COMMIT;
END eliminar_cliente;
/

--------------------------------membresia--------------------------------------------


----------------------------insert--------------------------------------------
CREATE SEQUENCE seq_id_membresia
START WITH 10
INCREMENT BY 1
NOCACHE;

CREATE OR REPLACE PROCEDURE sp_insert_membresia(
    p_id_cliente IN NUMBER,          
    p_monto IN NUMBER,               
    p_estado IN VARCHAR2,            
    p_fecha IN DATE                  
) AS
BEGIN
    INSERT INTO membresia (id, id_cliente, monto, estado, fecha)
    VALUES (seq_id_membresia.NEXTVAL, p_id_cliente, p_monto, p_estado, p_fecha);
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Membresía insertada correctamente.');
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error en sp_insert_membresia: ' || SQLERRM);
        RAISE;
END sp_insert_membresia;
/
----------------------------update--------------------------------------------
CREATE OR REPLACE PROCEDURE actualizar_membresia(
    p_id IN membresia.id%TYPE,
    p_monto IN membresia.monto%TYPE,
    p_estado IN membresia.estado%TYPE,
    p_fecha IN membresia.fecha%TYPE,
    p_resultado OUT NUMBER
) AS
BEGIN
    -- Intentar actualizar la membresía
    UPDATE membresia
    SET monto = p_monto,
        estado = p_estado,
        fecha = p_fecha
    WHERE id = p_id;

    -- Verificar la cantidad de filas afectadas
    IF SQL%ROWCOUNT > 0 THEN
        p_resultado := 1;  -- Actualización exitosa
        COMMIT;
    ELSE
        p_resultado := 0;  -- No se encontró la membresía
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        p_resultado := 0; 
        ROLLBACK;
        RAISE;  --
END actualizar_membresia;
/

----------------------------delete--------------------------------------------

CREATE OR REPLACE PROCEDURE sp_delete_membresia(
       p_id IN membresia.id%TYPE
   ) AS
   BEGIN
       DELETE FROM membresia
       WHERE id = p_id;

       IF SQL%ROWCOUNT = 0 THEN
           RAISE_APPLICATION_ERROR(-20036, 'La membresía no existe o ya ha sido eliminada.');
     END IF;
 
      NULL;  
  EXCEPTION
       WHEN OTHERS THEN
          RAISE_APPLICATION_ERROR(-20037, 'Error al eliminar la membresía: ' || SQLERRM);
  END sp_delete_membresia;
  /

--------------------------------rutinas--------------------------------------------


----------------------------insert--------------------------------------------
CREATE SEQUENCE seq_id_rutina
START WITH 10
INCREMENT BY 1
NOCACHE;



CREATE OR REPLACE PROCEDURE insertar_rutina(
    p_cliente IN rutinas.cliente%TYPE,
    p_instructor IN rutinas.instructor%TYPE,
    p_maquina IN rutinas.maquina%TYPE,
    p_fecha IN rutinas.fecha%TYPE,
    p_horas IN rutinas.horas%TYPE
) AS
BEGIN
    INSERT INTO rutinas (id_rutina, cliente, instructor, maquina, fecha, horas)
    VALUES (seq_id_rutina.NEXTVAL, p_cliente, p_instructor, p_maquina, p_fecha, p_horas);
    DBMS_OUTPUT.PUT_LINE('Rutina insertada correctamente.');
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error al insertar rutina: ' || SQLERRM);
        RAISE;
END insertar_rutina;
/

----------------------------update--------------------------------------------
CREATE OR REPLACE PROCEDURE actualizar_rutina(
    p_id_rutina IN rutinas.id_rutina%TYPE,
    p_cliente IN rutinas.cliente%TYPE,
    p_instructor IN rutinas.instructor%TYPE,
    p_maquina IN rutinas.maquina%TYPE,
    p_fecha IN VARCHAR2, -- Cambiar a VARCHAR2 para manejar la conversión de fecha
    p_horas IN rutinas.horas%TYPE,
    p_resultado OUT NUMBER
) AS
BEGIN
    UPDATE rutinas
    SET cliente = p_cliente,
        instructor = p_instructor,
        maquina = p_maquina,
        fecha = TO_DATE(p_fecha, 'YYYY-MM-DD'), -- Convierte la fecha al formato adecuado
        horas = p_horas
    WHERE id_rutina = p_id_rutina;
    
    IF SQL%ROWCOUNT > 0 THEN
        p_resultado := 1;  -- Se actualizó la rutina
        COMMIT;
    ELSE
        p_resultado := 0;  -- No se encontró la rutina
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        p_resultado := -1; 
        RAISE_APPLICATION_ERROR(-20001, 'Error al actualizar la rutina: ' || SQLERRM);
END;
/

----------------------------delete--------------------------------------------

 CREATE OR REPLACE PROCEDURE eliminar_rutina(
        p_id_rutina NUMBER
    ) AS
        v_existente NUMBER;
   BEGIN
        -- Verificar si la rutina existe
        SELECT COUNT(*) INTO v_existente FROM rutinas WHERE id_rutina = p_id_rutina;
  
       IF v_existente = 0 THEN
          RAISE_APPLICATION_ERROR(-20037, 'La rutina que desea eliminar no existe.');
       END IF;
 
       -- Eliminar la rutina si existe
      DELETE FROM rutinas WHERE id_rutina = p_id_rutina;
      DBMS_OUTPUT.PUT_LINE('Rutina eliminada correctamente.');
   EXCEPTION
      WHEN OTHERS THEN
          RAISE_APPLICATION_ERROR(-20038, 'Error al eliminar la rutina: ' || SQLERRM);
  END eliminar_rutina;
 /



--------------------------------maquinas--------------------------------------------


----------------------------insert--------------------------------------------
CREATE SEQUENCE seq_id_maquina
START WITH 10
INCREMENT BY 1
NOCACHE;


CREATE OR REPLACE PROCEDURE insertar_maquina(
    p_descripcion VARCHAR2,
    p_estado VARCHAR2,
    p_dificultad VARCHAR2
) AS
BEGIN
    INSERT INTO maquinas (id_maquina, descripcion, estado, dificultad)
    VALUES (seq_id_maquina.NEXTVAL, p_descripcion, p_estado, p_dificultad);
    DBMS_OUTPUT.PUT_LINE('Máquina insertada correctamente.');
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error al insertar máquina: ' || SQLERRM);
        RAISE;
END insertar_maquina;
/

----------------------------update--------------------------------------------**************************************
CREATE OR REPLACE PROCEDURE actualizar_maquina(
    p_id_maquina IN maquinas.id_maquina%TYPE,
    p_descripcion IN maquinas.descripcion%TYPE,
    p_dificultad IN maquinas.dificultad%TYPE,
    p_estado IN maquinas.estado%TYPE,
    p_resultado OUT NUMBER
) AS
BEGIN
    UPDATE maquinas
    SET descripcion = p_descripcion,
        dificultad = p_dificultad,
        estado = p_estado
    WHERE id_maquina = p_id_maquina;
    
    IF SQL%ROWCOUNT > 0 THEN
        p_resultado := 1;  -- Se actualizó la máquina
        COMMIT;
    ELSE
        p_resultado := 0;  -- No se encontró la máquina
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        p_resultado := 0;  -- Error en la actualización
        ROLLBACK;
        RAISE;
END actualizar_maquina;
/
----------------------------delete--------------------------------------------
CREATE OR REPLACE PROCEDURE eliminar_maquina(
  p_id_maquina IN NUMBER
) AS
  v_existente NUMBER;
BEGIN
  -- Verificar si la máquina existe
  SELECT COUNT(*) INTO v_existente FROM maquinas WHERE id_maquina = p_id_maquina;

  IF v_existente = 0 THEN
    RAISE_APPLICATION_ERROR(-20039, 'La máquina que desea eliminar no existe.');
  END IF;

  -- Eliminar la máquina si existe
  DELETE FROM maquinas WHERE id_maquina = p_id_maquina;

  COMMIT;  -- Asegurarse de confirmar la eliminación
  DBMS_OUTPUT.PUT_LINE('Máquina eliminada correctamente.');
EXCEPTION
  WHEN OTHERS THEN
    RAISE_APPLICATION_ERROR(-20040, 'Error al eliminar la máquina: ' || SQLERRM);
END eliminar_maquina;
/



-------------------------------- trabajador--------------------------------------------


----------------------------insert--------------------------------------------
CREATE OR REPLACE PROCEDURE insertar_trabajador (
    p_cod_instructor     INT,
    p_nombre             VARCHAR2,
    p_apellido1          VARCHAR2,
    p_apellido2          VARCHAR2,
    p_direccion          VARCHAR2,
    p_e_mail             VARCHAR2,
    p_tel_cel            INT,
    p_tel_habitacion     INT,
    p_fecha_contratacion DATE,
    p_rool               VARCHAR2
) AS
BEGIN
    INSERT INTO trabajador (
        cod_instructor, nombre, apellido1, apellido2, direccion, e_mail, 
        tel_cel, tel_habitacion, fecha_contratacion, rool
    ) VALUES (
        p_cod_instructor, p_nombre, p_apellido1, p_apellido2, p_direccion, 
        p_e_mail, p_tel_cel, p_tel_habitacion, p_fecha_contratacion, p_rool
    );

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20001, 'Error al insertar trabajador: ' || SQLERRM);
END;
/

----------------------------update--------------------------------------------
CREATE OR REPLACE PROCEDURE actualizar_trabajador(
    p_cod_instructor IN trabajador.cod_instructor%TYPE,
    p_nombre IN trabajador.nombre%TYPE,
    p_apellido1 IN trabajador.apellido1%TYPE,
    p_apellido2 IN trabajador.apellido2%TYPE,
    p_direccion IN trabajador.direccion%TYPE,
    p_e_mail IN trabajador.e_mail%TYPE,
    p_tel_cel IN trabajador.tel_cel%TYPE,
    p_tel_habitacion IN trabajador.tel_habitacion%TYPE,
    p_fecha_contratacion IN trabajador.fecha_contratacion%TYPE,
    p_rool IN trabajador.rool%TYPE,
    p_resultado OUT NUMBER
) AS
BEGIN
    UPDATE trabajador
    SET nombre = p_nombre,
        apellido1 = p_apellido1,
        apellido2 = p_apellido2,
        direccion = p_direccion,
        e_mail = p_e_mail,
        tel_cel = p_tel_cel,
        tel_habitacion = p_tel_habitacion,
        fecha_contratacion = p_fecha_contratacion,
        rool = p_rool
    WHERE cod_instructor = p_cod_instructor;
    
    IF SQL%ROWCOUNT > 0 THEN
        p_resultado := 1;  -- Se actualizó el trabajador
        COMMIT;
    ELSE
        p_resultado := 0;  -- No se encontró el trabajador
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        p_resultado := 0;  -- Error en la actualización
        ROLLBACK;
        RAISE;
END actualizar_trabajador;
/


----------------------------delete--------------------------------------------
CREATE OR REPLACE PROCEDURE eliminar_trabajador(
        p_cod_instructor NUMBER
    ) AS
        v_trabajador_existente NUMBER;
        v_rutinas_existente NUMBER;
        v_historial_existente NUMBER;
    BEGIN
        -- Verificar si el trabajador existe
        SELECT COUNT(*) INTO v_trabajador_existente
       FROM trabajador
       WHERE cod_instructor = p_cod_instructor;
 
       IF v_trabajador_existente = 0 THEN
           RAISE_APPLICATION_ERROR(-20044, 'El trabajador no existe.');
       END IF;
 
       -- Verificar si el trabajador está relacionado en la tabla rutinas
       SELECT COUNT(*) INTO v_rutinas_existente
       FROM rutinas
       WHERE instructor = p_cod_instructor;
 
       IF v_rutinas_existente > 0 THEN
           RAISE_APPLICATION_ERROR(-20038, 'No se puede eliminar el trabajador porque tiene rutinas asociadas.');
       END IF;
 
       -- Verificar si el trabajador está relacionado en la tabla historial_curso
       SELECT COUNT(*) INTO v_historial_existente
       FROM historial_curso
       WHERE instructor = p_cod_instructor;
 
       IF v_historial_existente > 0 THEN
           RAISE_APPLICATION_ERROR(-20039, 'No se puede eliminar el trabajador porque tiene un historial de cursos asociado.');
       END IF;
 
       -- Eliminar el trabajador si no tiene relaciones
       DELETE FROM trabajador WHERE cod_instructor = p_cod_instructor;
      DBMS_OUTPUT.PUT_LINE('Trabajador eliminado correctamente.');
   EXCEPTION
       WHEN OTHERS THEN
          DBMS_OUTPUT.PUT_LINE('Error al eliminar trabajador: ' || SQLERRM);
           RAISE;
   END eliminar_trabajador;
   /



--------------------------------historial Curso--------------------------------------------


----------------------------insert--------------------------------------------
CREATE SEQUENCE seq_id_historial_curso
START WITH 5
INCREMENT BY 1
NOCACHE;




CREATE OR REPLACE PROCEDURE insertar_historial_curso(
    p_cliente INT,
    p_id_curso NUMBER,
    p_instructor NUMBER,
    p_fecha_inscripcion DATE,
    p_horas NUMBER
) AS
BEGIN
    INSERT INTO historial_curso (id_historial, cliente, instructor, curso, fecha, horas)
    VALUES (seq_id_historial_curso.NEXTVAL, p_cliente, p_instructor,p_id_curso, p_fecha_inscripcion, p_horas);
    DBMS_OUTPUT.PUT_LINE('Historial de curso insertado correctamente.');
END;
/

----------------------------update--------------------------------------------
CREATE OR REPLACE PROCEDURE actualizar_historial_curso(
    p_id_historial IN historial_curso.id_historial%TYPE,
    p_fecha IN historial_curso.fecha%TYPE,
    p_horas IN historial_curso.horas%TYPE,
    p_resultado OUT NUMBER
) AS
BEGIN
    UPDATE historial_curso
    SET fecha = p_fecha,
        horas = p_horas
    WHERE id_historial = p_id_historial;
    
    IF SQL%ROWCOUNT > 0 THEN
        p_resultado := 1;  -- Se actualizó el historial correctamente
        COMMIT;
    ELSE
        p_resultado := 0;  -- No se encontró el registro del historial
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        p_resultado := 0;  -- Error en la actualización
        ROLLBACK;
        RAISE;
END actualizar_historial_curso;
/
----------------------------delete--------------------------------------------
CREATE OR REPLACE PROCEDURE eliminar_historial_curso(
        p_id_historial NUMBER
    ) AS
        v_existente NUMBER;
    BEGIN
        -- Verificar si el historial de curso existe
        SELECT COUNT(*) INTO v_existente FROM historial_curso WHERE id_historial = p_id_historial;
  
        IF v_existente = 0 THEN
           -- Lanzar un error si no existe
           RAISE_APPLICATION_ERROR(-20046, 'El historial de curso que desea eliminar no existe.');
       ELSE
           -- Proceder con la eliminación si existe
           DELETE FROM historial_curso WHERE id_historial = p_id_historial;
           DBMS_OUTPUT.PUT_LINE('Historial de curso eliminado correctamente.');
       END IF;
 
   EXCEPTION
       WHEN OTHERS THEN
          -- Capturar y reportar cualquier otro error inesperado
           RAISE_APPLICATION_ERROR(-20047, 'Error al eliminar el historial de curso: ' || SQLERRM);
   END eliminar_historial_curso;
   /




--------------------------------curso--------------------------------------------


----------------------------insert--------------------------------------------
CREATE SEQUENCE seq_id_curso
START WITH 5
INCREMENT BY 1
NOCACHE;

create or replace PROCEDURE insertar_curso(
    p_descripcion VARCHAR2,
    p_horario VARCHAR2,
    p_disponibilidad VARCHAR2
) AS
BEGIN
    -- Insertar el curso, generando automáticamente el id_curso con la secuencia
    INSERT INTO cursos (id_curso, descripcion, horario, disponibilidad)
    VALUES (seq_id_curso.NEXTVAL, p_descripcion, p_horario, p_disponibilidad);

    -- Realizar commit para asegurar que los cambios se guarden
    -- COMMIT;

    DBMS_OUTPUT.PUT_LINE('Curso insertado correctamente.');
END;
/


----------------------------update--------------------------------------------
CREATE OR REPLACE PROCEDURE editar_curso(
    p_id_curso NUMBER,
    p_descripcion VARCHAR2,
    p_horario VARCHAR2,
    p_disponibilidad VARCHAR2,
) AS
BEGIN
    IF p_descripcion IS NOT NULL THEN
        UPDATE cursos
        SET descripcion = p_descripcion
        WHERE id_curso = p_id_curso;
    END IF;

    -- Actualizar el horario si se proporciona
    IF p_horario IS NOT NULL THEN
        UPDATE cursos
        SET horario = p_horario
        WHERE id_curso = p_id_curso;
    END IF;

    -- Actualizar la disponibilidad si se proporciona
    IF p_disponibilidad IS NOT NULL THEN
        UPDATE cursos
        SET disponibilidad = p_disponibilidad
        WHERE id_curso = p_id_curso;
    END IF;
    COMMIT;
END;
/

---------------------------delete--------------------------------------------
 CREATE OR REPLACE PROCEDURE eliminar_curso(
        p_id_curso NUMBER
    ) AS
        v_existente NUMBER;
    BEGIN
        -- Verificar si el curso existe
        SELECT COUNT(*) INTO v_existente FROM cursos WHERE id_curso = p_id_curso;
  
        IF v_existente = 0 THEN
           -- Si el curso no existe, lanzar un error
           RAISE_APPLICATION_ERROR(-20044, 'El curso que desea eliminar no existe.');
       END IF;
 
       -- Intentar eliminar el curso
       DELETE FROM cursos WHERE id_curso = p_id_curso;
       DBMS_OUTPUT.PUT_LINE('Curso eliminado correctamente.');
   EXCEPTION
       WHEN OTHERS THEN
          -- Manejar cualquier error y devolverlo al llamador
           RAISE_APPLICATION_ERROR(-20045, 'Error al eliminar el curso: ' || SQLERRM);
   END eliminar_curso;
   /


--------------------auditoria---------------
CREATE OR REPLACE PROCEDURE ver_auditorias (p_cursor OUT SYS_REFCURSOR) AS
BEGIN
    OPEN p_cursor FOR
        SELECT 
            username,        
            obj_name,           
            action_name,       
            timestamp,          
            returncode          
        FROM 
            user_audit_trail
        WHERE 
            obj_name IN ('CLIENTE', 'MEMBRESIA', 'RUTINAS', 'MAQUINAS', 'TRABAJADOR', 'HISTORIAL_CURSO', 'CURSOS')
        ORDER BY 
            timestamp DESC;
END;
/


-----------------------------------selects----------------------------------


-- Procedimiento para buscar una membresía por su ID
CREATE OR REPLACE PROCEDURE buscar_membresia (
    p_id INT,
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT id, id_cliente, monto, estado, fecha
        FROM membresia
        WHERE id = p_id;
END;
/

-- Procedimiento para buscar una membresía por el ID del cliente
CREATE OR REPLACE PROCEDURE buscar_membresia_por_cliente (
    p_id_cliente INT,
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT id, id_cliente, monto, estado, fecha
        FROM membresia
        WHERE id_cliente = p_id_cliente;
END;
/
 
-- Procedimiento para buscar una rutina por su ID
CREATE OR REPLACE PROCEDURE buscar_rutina (
    p_id_rutina INT,
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT id_rutina, cliente, instructor, maquina, fecha, horas
        FROM rutinas
        WHERE id_rutina = p_id_rutina;
END;
/
 
-- Procedimiento para buscar una máquina por su ID
CREATE OR REPLACE PROCEDURE buscar_maquina (
    p_id_maquina INT,
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT id_maquina, descripcion, estado, dificultad
        FROM maquinas
        WHERE id_maquina = p_id_maquina;
END;
/
 
-- Procedimiento para buscar un trabajador por su código de instructor
CREATE OR REPLACE PROCEDURE buscar_trabajador (
    p_cod_instructor INT,
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT cod_instructor, nombre, apellido1, apellido2, direccion, e_mail, 
               tel_cel, tel_habitacion, fecha_contratacion, rool
        FROM trabajador
        WHERE cod_instructor = p_cod_instructor;
END;
/
 
-- Procedimiento para buscar un historial de curso por su ID
CREATE OR REPLACE PROCEDURE buscar_historial_curso (
    p_id_historial INT,
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT id_historial, cliente, instructor, curso, fecha, horas
        FROM historial_curso
        WHERE id_historial = p_id_historial;
END;
/
 
-- Procedimiento para buscar un curso por su ID
CREATE OR REPLACE PROCEDURE buscar_curso (
    p_id_curso INT,
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT id_curso, descripcion, horario, disponibilidad
        FROM cursos
        WHERE id_curso = p_id_curso;
END;
/


-- Procedimiento para obtener todos los registros de la tabla Cliente
CREATE OR REPLACE PROCEDURE obtener_todos_clientes (
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT * FROM cliente;
END;
/

-- Procedimiento para obtener todos los registros de la tabla Membresia
CREATE OR REPLACE PROCEDURE obtener_todas_membresias (
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT * FROM membresia;
END;
/

-- Procedimiento para obtener todos los registros de la tabla Maquinas
CREATE OR REPLACE PROCEDURE obtener_todas_maquinas (
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT * FROM maquinas;
END;
/

-- Procedimiento para obtener todos los registros de la tabla Rutinas
CREATE OR REPLACE PROCEDURE obtener_todas_rutinas (
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT * FROM rutinas;
END;
/

-- Procedimiento para obtener todos los registros de la tabla Trabajador
CREATE OR REPLACE PROCEDURE obtener_todos_trabajadores (
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT * FROM trabajador;
END;
/

-- Procedimiento para obtener todos los registros de la tabla Cursos
CREATE OR REPLACE PROCEDURE obtener_todos_cursos (
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT * FROM cursos;
END;
/

-- Procedimiento para obtener todos los registros de la tabla Historial_Curso
CREATE OR REPLACE PROCEDURE obtener_todos_historial_curso (
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT * FROM historial_curso;
END;
/


CREATE OR REPLACE PROCEDURE obtener_usuario (
    p_id IN INT,  -- ID de cliente o trabajador
    p_resultado OUT SYS_REFCURSOR  -- Cursor de la búsqueda
) AS
BEGIN
    -- Intentar buscar en la tabla cliente
    DECLARE
        v_role VARCHAR2(30);
    BEGIN
        -- Intentar obtener 'cliente' si se encuentra en la tabla cliente
        SELECT 'cliente' 
        INTO v_role
        FROM cliente
        WHERE cedula = p_id;
        
        -- Si se encuentra en la tabla cliente, se abre el cursor con el valor 'cliente'
        OPEN p_resultado FOR
        SELECT v_role AS role FROM dual;
        RETURN;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            -- Si no se encuentra en cliente, buscar en la tabla trabajador
            NULL;  -- No hacer nada, continuar con el siguiente bloque
    END;

    -- Intentar buscar en la tabla trabajador
    OPEN p_resultado FOR
        SELECT rool AS role
        FROM trabajador
        WHERE cod_instructor = p_id;
    
    -- Si se encuentra en la tabla trabajador, devolver el cursor con el rol
    RETURN;
END;
/

ALTER SESSION SET "_ORACLE_SCRIPT"=TRUE;

--No se crean clientes porque se crean en caliente

--Instructores del sistema--

INSERT INTO trabajador (cod_instructor, nombre, apellido1, apellido2, direccion, e_mail, tel_cel, tel_habitacion, fecha_contratacion, rool)
VALUES (1110, 'CBUM', 'Casemiro', 'Oreamuno', 'Avenida Principal 101', 'cbum@email.com', 987654324, 123456786, TO_DATE('2023-11-10', 'YYYY-MM-DD'), 'instructor');

INSERT INTO trabajador (cod_instructor, nombre, apellido1, apellido2, direccion, e_mail, tel_cel, tel_habitacion, fecha_contratacion, rool)
VALUES (2220, 'Ronny', 'Coleman', 'Coleman', 'Calle Ficticia 789', 'carlos.gonzalez@email.com', 987654323, 123456787, TO_DATE('2023-11-01', 'YYYY-MM-DD'), 'instructor');

CREATE USER user_1110 IDENTIFIED BY 12345;
GRANT instructor TO user_1110;

CREATE USER user_2220 IDENTIFIED BY 12345;
GRANT instructor TO user_1110;


--Soportes del sistema--

INSERT INTO trabajador (cod_instructor, nombre, apellido1, apellido2, direccion, e_mail, tel_cel, tel_habitacion, fecha_contratacion, rool)
VALUES (404090, 'Cristiano', 'Ronaldo', 'dos Santo', 'San jose, av central', 'cristianoRonaldo@email.com', 22756101, 88709011, TO_DATE('2023-11-10', 'YYYY-MM-DD'), 'soporte');

INSERT INTO trabajador (cod_instructor, nombre, apellido1, apellido2, direccion, e_mail, tel_cel, tel_habitacion, fecha_contratacion, rool)
VALUES (808010, 'Leonal Andres', 'Messi', 'Cuccittin', 'Heredia, San Rafael', 'leoMessi@email.com', 22750990, 88709010, TO_DATE('2023-11-10', 'YYYY-MM-DD'), 'soporte');

CREATE USER user_404090 IDENTIFIED BY 12345;
GRANT soporte TO user_404090;

CREATE USER user_808010 IDENTIFIED BY 12345;
GRANT soporte TO user_404090;


SET SERVEROUTPUT ON;

--Grants para los procedimientos del rol usuario_cliente
GRANT EXECUTE ON super_user.obtener_usuario TO usuario_cliente;


--Grant para los procedimientos del rol instructor
GRANT EXECUTE ON super_user.obtener_usuario TO instructor;


GRANT EXECUTE ON super_user.obtener_usuario TO soporte;

---------------------------usuario_cliente permiso procedures---------------------------------
--se le asigna los permisos 

--cada usuario se puede inscribir al gimnasio por medio de la aplicación.
--Desinscribirse: el cliente puede retirar su inscripción al gimnasio siempre y cuando se encuentre al día con los pagos.  

-- Permisos para procedimientos de 'membresia'
GRANT EXECUTE ON sp_insert_membresia TO usuario_cliente;
GRANT EXECUTE ON sp_delete_membresia TO usuario_cliente;
GRANT EXECUTE ON actualizar_membresia TO usuario_cliente;
GRANT EXECUTE ON buscar_membresia_membresia TO usuario_cliente; 
GRANT EXECUTE ON obtener_todas_membresias TO usuario_cliente; 
GRANT EXECUTE ON buscar_membresia_por_cliente TO usuario_cliente;

-- Permisos para procedimientos de 'clientes'
GRANT EXECUTE ON eliminar_cliente TO usuario_cliente;   
GRANT EXECUTE ON actualizar_cliente  TO usuario_cliente;
GRANT EXECUTE ON mostrar_informacion_cliente TO usuario_cliente;

---------------------------instructor permiso procedures---------------------------------------

--esta opción es para los instructores o personal del gimnasio, en caso de que requieran
-- dar mantenimiento (select, insert, update y delete) a las rutinas, maquinas, clientes, cursos, historial de los cursos, etc. 

-- Permisos para procedimientos de 'rutinas'
GRANT EXECUTE ON insertar_rutina TO instructor;
GRANT EXECUTE ON eliminar_rutina TO instructor;
GRANT EXECUTE ON actualizar_rutina TO instructor;
GRANT EXECUTE ON buscar_rutina TO instructor;
GRANT EXECUTE ON obtener_todas_rutinas TO instructor;

-- Permisos para procedimientos de 'maquinas'
GRANT EXECUTE ON insertar_maquina TO instructor;
GRANT EXECUTE ON eliminar_maquina TO instructor;
GRANT EXECUTE ON actualizar_maquina TO instructor;
GRANT EXECUTE ON buscar_maquina TO instructor;
GRANT EXECUTE ON obtener_todas_maquinas TO instructor;

-- Permisos para procedimientos de 'clientes'
GRANT EXECUTE ON insertar_cliente TO instructor;
GRANT EXECUTE ON eliminar_cliente TO instructor;
GRANT EXECUTE ON actualizar_cliente  TO instructor;
GRANT EXECUTE ON mostrar_informacion_cliente TO instructor;
GRANT EXECUTE ON obtener_todos_clientes TO instructor;

-- Permisos para procedimientos de 'cursos'
GRANT EXECUTE ON insertar_curso TO instructor;
GRANT EXECUTE ON eliminar_curso TO instructor;
GRANT EXECUTE ON editar_curso TO instructor;
GRANT EXECUTE ON buscar_curso TO instructor;
GRANT EXECUTE ON obtener_todos_cursos TO instructor;

-- Permisos para procedimientos de 'historial_curso'
GRANT EXECUTE ON insertar_historial_curso TO instructor;
GRANT EXECUTE ON eliminar_historial_curso TO instructor;
GRANT EXECUTE ON actualizar_historial_curso TO instructor;
GRANT EXECUTE ON buscar_historial_curso TO instructor;
GRANT EXECUTE ON obtener_todos_historial_curso TO instructor;

-- Permisos para procedimientos de 'membresia'
GRANT EXECUTE ON sp_insert_membresia TO instructor;
GRANT EXECUTE ON sp_delete_membresia TO instructor;
GRANT EXECUTE ON actualizar_membresia TO instructor;
GRANT EXECUTE ON buscar_membresia TO instructor;
GRANT EXECUTE ON obtener_todas_membresias TO instructor;
GRANT EXECUTE ON buscar_membresia_por_cliente TO instructor;

-- Permiso de solo SELECT para la tabla 'instructor'
GRANT EXECUTE ON buscar_trabajador TO instructor;
GRANT EXECUTE ON obtener_todos_trabajadores TO instructor;

COMMIT;

