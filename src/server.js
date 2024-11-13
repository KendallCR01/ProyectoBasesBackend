import express from 'express';
import oracledb from 'oracledb';
import cors from 'cors';  //npm install express oracledb...

const app = express();
const port = 3000;

// Configuración de la conexión a la base de datos
const dbConfig = {
    user: 'super_user',
    password: 'root',
    connectString: 'localhost:1521/XE' // Aquí usas el SID
};

const sysdbaConfig = {
    user: 'sys',
    password: 'root',
    connectString: 'localhost:1521/XE',
    privilege: oracledb.SYSDBA
};

// Habilitar CORS para todas las solicitudes
app.use(cors());
app.use(express.json());

//--------------------Todos los buscar individual------------------------------------

//Busca membresia por id
app.get('/buscar-membresia/:id', async (req, res) => {
    let connection;
    const id = req.params.id;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Ejecutar el procedimiento almacenado
        const result = await connection.execute(
            `BEGIN super_user.buscar_membresia(:id, :cursor); END;`,
            {
                id: id, // Parámetro para el procedimiento
                cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } // Definir el cursor de salida
            }
        );

        const cursor = result.outBinds.cursor;
        const rows = await cursor.getRows(); // Obtener las filas del cursor

        // Si se encuentran resultados, formateamos los datos
        if (rows.length > 0) {
            const membresia = {
                id: rows[0][0],
                id_cliente: rows[0][1],
                monto: rows[0][2],
                estado: rows[0][3],
                fecha: rows[0][4]
            };
            res.json(membresia); // Devolver los datos como un objeto JSON
        } else {
            res.status(404).json({ message: 'Membresía no encontrada' });
        }

    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        res.status(500).send('Error al conectar a la base de datos');
    } finally {
        // Asegurarse de cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});


app.post('/login', async (req, res) => {
    let { user, password } = req.body;

    if (!user || !password) {
        return res.status(400).json({ message: 'El usuario y la contraseña son obligatorios' });
    }

    // Agregar "user_" al nombre de usuario
    const usuario = `user_${user}`;

    let connection;
    try {
        // Intentar conectar con los parámetros proporcionados
        connection = await oracledb.getConnection({
            user: usuario,
            password: password,
            connectString: dbConfig.connectString
        });

        console.log('Conexión exitosa con la base de datos');
        dbConfig.user = usuario;
        dbConfig.password = password;

        // Llamar al procedimiento para obtener el resultado (un solo valor)
        const result = await connection.execute(
            `BEGIN super_user.obtener_usuario(:p_id, :p_roles); END;`,  // Usar p_id en lugar de :user
            {
                p_id: user, // Asignamos el parámetro correctamente
                p_roles: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
            }
        );
        const status = 'Usuario autenticado correctamente y rol verificado';
        // Obtener el cursor con el valor
        const rows = await result.outBinds.p_roles.getRows(); // Obtener las filas del cursor

        // Si se encuentran resultados, devolver el valor
        if (rows.length > 0) {
            const role = rows[0][0]; // Solo tomamos el primer valor del cursor
            return res.status(200).json({
                message: status,
                role: role // Devolvemos el valor único obtenido
            });
        } else {
            // Si no se encuentra ningún rol
            return res.status(404).json({ Estado: 'No se encontraron roles para este usuario' });
        }
    } catch (err) {
        console.error('Error al conectar con la base de datos:', err);
        return res.status(500).json({
            message: 'Error al conectar con la base de datos',
            error: err.message
        });
    } finally {
        // Cerrar la conexión si fue establecida
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

// Busca rutina por id
app.get('/buscar-rutina/:id', async (req, res) => {
    let connection;
    const id = req.params.id;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Ejecutar el procedimiento almacenado
        const result = await connection.execute(
            `BEGIN super_user.buscar_rutina(:id, :cursor); END;`,
            {
                id: id, // Parámetro para el procedimiento
                cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } // Definir el cursor de salida
            }
        );

        const cursor = result.outBinds.cursor;
        const rows = await cursor.getRows(); // Obtener las filas del cursor

        // Si se encuentran resultados, formateamos los datos
        if (rows.length > 0) {
            const rutina = {
                id_rutina: rows[0][0],
                cliente: rows[0][1],
                instructor: rows[0][2],
                maquina: rows[0][3],
                fecha: rows[0][4],
                horas: rows[0][5]
            };
            res.json(rutina); // Devolver los datos como un objeto JSON
        } else {
            res.status(404).json({ message: 'Rutina no encontrada' });
        }

    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        res.status(500).send('Error al conectar a la base de datos');
    } finally {
        // Asegurarse de cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

//Busca membresia por id
app.get('/buscar-maquina/:id', async (req, res) => {
    let connection;
    const id = req.params.id;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Ejecutar el procedimiento almacenado
        const result = await connection.execute(
            `BEGIN super_user.buscar_maquina(:id, :cursor); END;`,
            {
                id: id, // Parámetro para el procedimiento
                cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } // Definir el cursor de salida
            }
        );

        const cursor = result.outBinds.cursor;
        const rows = await cursor.getRows(); // Obtener las filas del cursor

        // Si se encuentran resultados, formateamos los datos
        if (rows.length > 0) {
            const maquina = {
                id_maquina: rows[0][0],
                descripcion: rows[0][1],
                estado: rows[0][2],
                dificultad: rows[0][3],
            };
            res.json(maquina); // Devolver los datos como un objeto JSON
        } else {
            res.status(404).json({ message: 'Maquina no encontrada' });
        }

    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        res.status(500).send('Error al conectar a la base de datos');
    } finally {
        // Asegurarse de cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

app.get('/buscar-trabajador/:id', async (req, res) => {
    let connection;
    const id = req.params.id;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Ejecutar el procedimiento almacenado
        const result = await connection.execute(
            `BEGIN super_user.buscar_trabajador(:id, :cursor); END;`,
            {
                id: id, // Parámetro para el procedimiento
                cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } // Definir el cursor de salida
            }
        );

        const cursor = result.outBinds.cursor;
        const rows = await cursor.getRows(); // Obtener las filas del cursor

        // Si se encuentran resultados, formateamos los datos
        if (rows.length > 0) {
            const trabajador = {
                cod_instructor: rows[0][0],
                nombre: rows[0][1],
                apellido1: rows[0][2],
                apellido2: rows[0][3],
                direccion: rows[0][4],
                e_mail: rows[0][5],
                tel_cel: rows[0][6],
                tel_habitacion: rows[0][7],
                fecha_contratacion: rows[0][8],
                rool: rows[0][8]
            };
            res.json(trabajador); // Devolver los datos como un objeto JSON
        } else {
            res.status(404).json({ message: 'Trabajador no encontrada' });
        }

    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        res.status(500).send('Error al conectar a la base de datos');
    } finally {
        // Asegurarse de cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});


app.get('/buscar-historial-curso/:id', async (req, res) => {
    let connection;
    const id = req.params.id;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Ejecutar el procedimiento almacenado
        const result = await connection.execute(
            `BEGIN super_user.buscar_historial_curso(:id, :cursor); END;`,
            {
                id: id, // Parámetro para el procedimiento
                cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } // Definir el cursor de salida
            }
        );

        const cursor = result.outBinds.cursor;
        const rows = await cursor.getRows(); // Obtener las filas del cursor

        // Si se encuentran resultados, formateamos los datos
        if (rows.length > 0) {
            const historial = {
                id_historial: rows[0][0],
                cliente: rows[0][1],
                instructor: rows[0][2],
                curso: rows[0][3],
                fecha: rows[0][4],
                horas: rows[0][5]
            };
            res.json(historial); // Devolver los datos como un objeto JSON
        } else {
            res.status(404).json({ message: 'Historial de curso no encontrada' });
        }

    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        res.status(500).send('Error al conectar a la base de datos');
    } finally {
        // Asegurarse de cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});



app.get('/buscar-curso/:id', async (req, res) => {
    let connection;
    const id = req.params.id;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Ejecutar el procedimiento almacenado
        const result = await connection.execute(
            `BEGIN super_user.buscar_curso(:id, :cursor); END;`,
            {
                id: id, // Parámetro para el procedimiento
                cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } // Definir el cursor de salida
            }
        );

        const cursor = result.outBinds.cursor;
        const rows = await cursor.getRows(); // Obtener las filas del cursor

        // Si se encuentran resultados, formateamos los datos
        if (rows.length > 0) {
            const curso = {
                id_curso: rows[0][0],
                descripcion: rows[0][1],
                horario: rows[0][2],
                disponibilidad: rows[0][3]
            };
            res.json(curso); // Devolver los datos como un objeto JSON
        } else {
            res.status(404).json({ message: 'Curso no encontrada' });
        }

    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        res.status(500).send('Error al conectar a la base de datos');
    } finally {
        // Asegurarse de cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

//-----------------------Todos los obtener todos de algo-------------------------------------------------

app.get('/obtener-todos-clientes', async (req, res) => {
    let connection;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Ejecutar el procedimiento almacenado
        const result = await connection.execute(
            `BEGIN super_user.obtener_todos_clientes(:cursor); END;`,
            {
                cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } // Definir el cursor de salida
            }
        );

        const cursor = result.outBinds.cursor;
        const rows = await cursor.getRows(); // Obtener las filas del cursor

        // Si se encuentran resultados, formateamos los datos
        if (rows.length > 0) {
            // Mapeamos las filas a un formato más legible
            const clientes = rows.map(row => ({
                cedula: row[0],  // Usamos "row" en lugar de "rows[0]"
                nombre: row[1],
                apellido1: row[2],
                apellido2: row[3],
                direccion: row[4],
                e_mail: row[5],
                fecha_inscripcion: row[6],
                celular: row[7],
                tel_habitacion: row[8]
            }));
            res.json(clientes); // Devolver los datos como un objeto JSON
        } else {
            res.status(404).json({ message: 'No se encontraron clientes' });
        }

    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        res.status(500).send('Error al conectar a la base de datos');
    } finally {
        // Asegurarse de cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});


app.post('/logout', async (req, res) => {

    try {
        // Verifica que el usuario tiene una conexión activa

        dbConfig.user = 'super_user';
        dbConfig.password = 'root';

    } catch (error) {
        console.error('Error al cerrar la sesión del usuario:', error);
        res.status(500).json({ message: 'Error al cerrar la sesión del usuario.' });
    }
});



app.get('/obtener-todas-membresias', async (req, res) => {
    let connection;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Ejecutar el procedimiento almacenado
        const result = await connection.execute(
            `BEGIN super_user.obtener_todas_membresias(:cursor); END;`,
            {
                cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } // Definir el cursor de salida
            }
        );

        const cursor = result.outBinds.cursor;
        const rows = await cursor.getRows(); // Obtener las filas del cursor

        // Si se encuentran resultados, formateamos los datos
        if (rows.length > 0) {
            // Mapeamos las filas a un formato más legible
            const membresias = rows.map(row => ({
                id: row[0],
                id_cliente: row[1],
                monto: row[2],
                estado: row[3],
                fecha: row[4]
            }));
            res.json(membresias); // Devolver los datos como un objeto JSON
        } else {
            res.status(404).json({ message: 'No se encontraron membresías' });
        }

    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        res.status(500).send('Error al conectar a la base de datos');
    } finally {
        // Asegurarse de cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

app.get('/obtener-todas-maquinas', async (req, res) => {
    let connection;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Ejecutar el procedimiento almacenado
        const result = await connection.execute(
            `BEGIN super_user.obtener_todas_maquinas(:cursor); END;`,
            {
                cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } // Definir el cursor de salida
            }
        );

        const cursor = result.outBinds.cursor;
        const rows = await cursor.getRows(); // Obtener las filas del cursor

        // Si se encuentran resultados, formateamos los datos
        if (rows.length > 0) {
            // Mapeamos las filas a un formato más legible
            const maquinas = rows.map(row => ({
                id_maquina: row[0],
                descripcion: row[1],
                estado: row[2],
                dificultad: row[3],
            }));
            res.json(maquinas); // Devolver los datos como un objeto JSON
        } else {
            res.status(404).json({ message: 'No se encontraron maquinas' });
        }

    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        res.status(500).send('Error al conectar a la base de datos');
    } finally {
        // Asegurarse de cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});


app.get('/obtener-todas-rutinas', async (req, res) => {
    let connection;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Ejecutar el procedimiento almacenado
        const result = await connection.execute(
            `BEGIN super_user.obtener_todas_rutinas(:cursor); END;`,
            {
                cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } // Definir el cursor de salida
            }
        );

        const cursor = result.outBinds.cursor;
        const rows = await cursor.getRows(); // Obtener las filas del cursor

        // Si se encuentran resultados, formateamos los datos
        if (rows.length > 0) {
            // Mapeamos las filas a un formato más legible
            const rutinas = rows.map(row => ({
                id_rutina: row[0],
                cliente: row[1],
                instructor: row[2],
                maquina: row[3],
                fecha: row[4],
                horas: row[5],
            }));
            res.json(rutinas); // Devolver los datos como un objeto JSON
        } else {
            res.status(404).json({ message: 'No se encontraron rutinas' });
        }

    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        res.status(500).send('Error al conectar a la base de datos');
    } finally {
        // Asegurarse de cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

app.get('/obtener-todos-trabajadores', async (req, res) => {
    let connection;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Ejecutar el procedimiento almacenado
        const result = await connection.execute(
            `BEGIN super_user.obtener_todos_trabajadores(:cursor); END;`,
            {
                cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } // Definir el cursor de salida
            }
        );

        const cursor = result.outBinds.cursor;
        const rows = await cursor.getRows(); // Obtener las filas del cursor

        // Si se encuentran resultados, formateamos los datos
        if (rows.length > 0) {
            // Mapeamos las filas a un formato más legible
            const trabajadores = rows.map(row => ({
                cod_instructor: row[0],
                nombre: row[1],
                apellido1: row[2],
                apellido2: row[3],
                direccion: row[4],
                e_mail: row[5],
                tel_cel: row[6],
                tel_habitacion: row[7],
                fecha_contratacion: row[8],
                rool: row[9],

            }));
            res.json(trabajadores); // Devolver los datos como un objeto JSON
        } else {
            res.status(404).json({ message: 'No se encontraron trabajadores' });
        }

    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        res.status(500).send('Error al conectar a la base de datos');
    } finally {
        // Asegurarse de cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});


app.get('/obtener-todos-cursos', async (req, res) => {
    let connection;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Ejecutar el procedimiento almacenado
        const result = await connection.execute(
            `BEGIN super_user.obtener_todos_cursos(:cursor); END;`,
            {
                cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } // Definir el cursor de salida
            }
        );

        const cursor = result.outBinds.cursor;
        const rows = await cursor.getRows(); // Obtener las filas del cursor

        // Si se encuentran resultados, formateamos los datos
        if (rows.length > 0) {
            // Mapeamos las filas a un formato más legible
            const cursos = rows.map(row => ({
                id_curso: row[0],
                descripcion: row[1],
                horario: row[2],
                disponibilidad: row[3],
            }));
            res.json(cursos); // Devolver los datos como un objeto JSON
        } else {
            res.status(404).json({ message: 'No se encontraron cursos' });
        }

    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        res.status(500).send('Error al conectar a la base de datos');
    } finally {
        // Asegurarse de cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});


app.get('/obtener-todos-historial-curso', async (req, res) => {
    let connection;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Ejecutar el procedimiento almacenado
        const result = await connection.execute(
            `BEGIN super_user.obtener_todos_historial_curso(:cursor); END;`,
            {
                cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } // Definir el cursor de salida
            }
        );

        const cursor = result.outBinds.cursor;
        const rows = await cursor.getRows(); // Obtener las filas del cursor

        // Si se encuentran resultados, formateamos los datos
        if (rows.length > 0) {
            // Mapeamos las filas a un formato más legible
            const historiales = rows.map(row => ({
                id_historial: row[0],
                cliente: row[1],
                instructor: row[2],
                curso: row[3],
                fecha: row[4],
                horas: row[5],
            }));
            res.json(historiales); // Devolver los datos como un objeto JSON
        } else {
            res.status(404).json({ message: 'No se encontraron historiales de curso' });
        }

    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        res.status(500).send('Error al conectar a la base de datos');
    } finally {
        // Asegurarse de cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

//-----------------------Todos los obtener info de instructor y cliente-------------------------------------

app.get('/buscar-info-instructor/:id_instructor', async (req, res) => {
    const { id_instructor } = req.params; // Obtenemos el ID del instructor desde los parámetros de la ruta
    let connection;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Ejecutar el procedimiento almacenado
        const result = await connection.execute(
            `BEGIN super_user.mostrar_informacion_instructor(:id_instructor, :cursor); END;`,
            {
                id_instructor: id_instructor,  // El ID del instructor se pasa en la URL
                cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }  // Definir el cursor de salida
            }
        );

        const cursor = result.outBinds.cursor;
        const rows = await cursor.getRows(); // Obtener las filas del cursor

        // Si se encuentran resultados, formateamos los datos
        if (rows.length > 0) {
            const instructores = rows.map(row => ({
                cod_instructor: row[0],
                nombre_instructor: row[1],
                apellido1: row[2],
                apellido2: row[3],
                direccion: row[4],
                e_mail: row[5],
                tel_cel: row[6],
                tel_habitacion: row[7],
                fecha_contratacion: row[8],
                curso: row[9],
                id_rutina: row[10],
                anios_trabajo: row[11]
            }));
            res.json(instructores); // Devolver los datos como un objeto JSON
        } else {
            res.status(404).json({ message: 'No se encontró al instructor' });
        }

    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        res.status(500).send('Error al conectar a la base de datos');
    } finally {
        // Asegurarse de cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

app.get('/buscar-info-cliente/:cedula_cliente', async (req, res) => {
    const { cedula_cliente } = req.params; // Obtenemos la cédula del cliente desde los parámetros de la ruta
    let connection;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Ejecutar el procedimiento almacenado
        const result = await connection.execute(
            `BEGIN super_user.mostrar_informacion_cliente(:cedula_cliente, :cursor); END;`,
            {
                cedula_cliente: cedula_cliente,  // La cédula del cliente a buscar
                cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }  // Definir el cursor de salida
            }
        );

        const cursor = result.outBinds.cursor;
        const rows = await cursor.getRows(); // Obtener las filas del cursor

        // Si se encuentran resultados, formateamos los datos
        if (rows.length > 0) {
            const clientes = rows.map(row => ({
                cedula: row[0],
                nombre_cliente: row[1],
                apellido1: row[2],
                apellido2: row[3],
                direccion: row[4],
                e_mail: row[5],
                fecha_inscripcion: row[6],
                celular: row[7],
                tel_habitacion: row[8]
            }));
            res.json(clientes); // Devolver los datos como un objeto JSON
        } else {
            res.status(404).json({ message: 'Cliente no encontrado' });
        }

    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        res.status(500).send('Error al conectar a la base de datos');
    } finally {
        // Asegurarse de cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

//--------------------------------TODOS LOS ACTUALIZAR-----------------------------

app.put('/actualizar-cliente', async (req, res) => {
    const { cedula, nombre, apellido1, direccion } = req.body;
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
            `BEGIN 
                super_user.actualizar_cliente(:cedula, :nombre, :apellido1, :direccion, :resultado); 
             END;`,
            {
                cedula: cedula,
                nombre: nombre,
                apellido1: apellido1,
                direccion: direccion,
                resultado: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            }
        );

        // Verificar el resultado del procedimiento
        if (result.outBinds.resultado === 1) {
            res.json({ message: 'Cliente actualizado con éxito' });
        } else {
            res.status(404).json({ message: 'Cliente no encontrado' });
        }

    } catch (err) {
        console.error('Error al actualizar el cliente:', err);
        res.status(500).json({ message: 'Error al actualizar el cliente', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

app.put('/actualizar-curso', async (req, res) => {
    const { id_curso, descripcion, horario, disponibilidad } = req.body;
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
            `BEGIN 
                super_user.actualizar_curso(:id_curso, :descripcion, :horario, :disponibilidad, :resultado); 
             END;`,
            {
                id_curso: id_curso,
                descripcion: descripcion,
                horario: horario,
                disponibilidad: disponibilidad,
                resultado: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            }
        );

        // Verificar el resultado del procedimiento
        if (result.outBinds.resultado === 1) {
            res.json({ message: 'Curso actualizado con éxito' });
        } else {
            res.status(404).json({ message: 'Curso no encontrado' });
        }

    } catch (err) {
        console.error('Error al actualizar el curso:', err);
        res.status(500).json({ message: 'Error al actualizar el curso', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});


app.put('/actualizar-rutina', async (req, res) => {
    const { id_rutina, cliente, instructor, maquina, fecha, horas } = req.body;
    let connection;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Llamar al procedimiento para actualizar la rutina
        const result = await connection.execute(
            `BEGIN
                super_user.actualizar_rutina(
                    :id_rutina, :cliente, :instructor, :maquina, :fecha, :horas, :resultado
                );
            END;`,
            {
                id_rutina: id_rutina,
                cliente: cliente,
                instructor: instructor,
                maquina: maquina,
                fecha: fecha, // Asegúrate de que la fecha esté en formato 'YYYY-MM-DD'
                horas: horas,
                resultado: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            }
        );

        const resultado = result.outBinds.resultado;

        if (resultado === 1) {
            res.status(200).json({ message: 'Rutina actualizada exitosamente' });
        } else if (resultado === 0) {
            res.status(404).json({ message: 'Rutina no encontrada' });
        } else {
            res.status(500).json({ message: 'Error al actualizar la rutina' });
        }
    } catch (err) {
        console.error('Error al actualizar la rutina:', err);
        res.status(500).json({
            message: 'Error al actualizar la rutina',
            error: err.message
        });
    } finally {
        // Asegurarse de cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

app.put('/actualizar-maquina', async (req, res) => {
    const { id_maquina, descripcion, dificultad, estado } = req.body;
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
            `BEGIN 
                super_user.actualizar_maquina(:id_maquina, :descripcion, :dificultad, :estado, :resultado); 
             END;`,
            {
                id_maquina: id_maquina,
                descripcion: descripcion,
                dificultad: dificultad,
                estado: estado,
                resultado: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            }
        );

        // Verificar el resultado del procedimiento
        if (result.outBinds.resultado === 1) {
            res.json({ message: 'Máquina actualizada con éxito' });
        } else {
            res.status(404).json({ message: 'Máquina no encontrada' });
        }

    } catch (err) {
        console.error('Error al actualizar la máquina:', err);
        res.status(500).json({ message: 'Error al actualizar la máquina', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

app.put('/actualizar-trabajador', async (req, res) => {
    const {
        cod_instructor,
        nombre,
        apellido1,
        apellido2,
        direccion,
        e_mail,
        tel_cel,
        tel_habitacion,
        fecha_contratacion,
        rool
    } = req.body;
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
            `BEGIN 
                super_user.actualizar_trabajador(
                    :cod_instructor, 
                    :nombre, 
                    :apellido1, 
                    :apellido2, 
                    :direccion, 
                    :e_mail, 
                    :tel_cel, 
                    :tel_habitacion, 
                    TO_DATE(:fecha_contratacion, 'YYYY-MM-DD'), 
                    :rool, 
                    :resultado
                ); 
             END;`,
            {
                cod_instructor: cod_instructor,
                nombre: nombre,
                apellido1: apellido1,
                apellido2: apellido2,
                direccion: direccion,
                e_mail: e_mail,
                tel_cel: tel_cel,
                tel_habitacion: tel_habitacion,
                fecha_contratacion: fecha_contratacion,
                rool: rool,
                resultado: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            }
        );

        // Verificar el resultado del procedimiento
        if (result.outBinds.resultado === 1) {
            res.json({ message: 'Trabajador actualizado con éxito' });
        } else {
            res.status(404).json({ message: 'Trabajador no encontrado' });
        }

    } catch (err) {
        console.error('Error al actualizar el trabajador:', err);
        res.status(500).json({ message: 'Error al actualizar el trabajador', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

app.put('/actualizar-historial', async (req, res) => {
    const {
        id_historial,
        fecha,
        horas
    } = req.body;

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `BEGIN 
                super_user.actualizar_historial_curso(
                    :id_historial,
                    TO_DATE(:fecha, 'YYYY-MM-DD'), 
                    :horas,
                    :resultado
                );
             END;`,
            {
                id_historial: id_historial,
                fecha: fecha,
                horas: horas,
                resultado: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            }
        );

        // Verificar el resultado del procedimiento
        if (result.outBinds.resultado === 1) {
            res.json({ message: 'Historial de curso actualizado con éxito' });
        } else {
            res.status(404).json({ message: 'Registro de historial no encontrado' });
        }
    } catch (err) {
        console.error('Error al actualizar el historial de curso:', err);
        res.status(500).json({
            message: 'Error al actualizar el historial de curso',
            error: err.message
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});
app.put('/actualizar-membresia', async (req, res) => {
    const {
        id,
        monto,
        estado,
        fecha
    } = req.body;

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `BEGIN 
                super_user.actualizar_membresia(
                    :id,
                    :monto,
                    :estado,
                    TO_DATE(:fecha, 'YYYY-MM-DD'),
                    :resultado
                );
             END;`,
            {
                id: id,
                monto: monto,
                estado: estado,
                fecha: fecha,
                resultado: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            }
        );

        // Verificar el resultado de la actualización
        if (result.outBinds.resultado === 1) {
            res.json({ message: 'Membresía actualizada con éxito' });
        } else {
            res.status(404).json({ message: 'Membresía no encontrada' });
        }
    } catch (err) {
        console.error('Error al actualizar la membresía:', err);
        res.status(500).json({
            message: 'Error al actualizar la membresía',
            error: err.message
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

// Eliminar cliente por cédula
app.delete('/eliminar-cliente/:cedula', async (req, res) => {
    let connection;
    const cedula = req.params.cedula;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Ejecutar el procedimiento almacenado para eliminar el cliente
        await connection.execute(
            `BEGIN
           super_user.eliminar_cliente(:cedula);
         END;`,
            { cedula: cedula }
        );

        res.json({ message: 'Cliente eliminado con éxito' });

    } catch (err) {
        console.error('Error al eliminar el cliente:', err);

        // Manejar errores personalizados de Oracle
        if (err.errorNum === 20034) {
            res.status(400).json({ message: 'No se puede eliminar el cliente porque tiene membresías asociadas.' });
        } else if (err.errorNum === 20035) {
            res.status(400).json({ message: 'No se puede eliminar el cliente porque tiene rutinas asociadas.' });
        } else if (err.errorNum === 20036) {
            res.status(400).json({ message: 'No se puede eliminar el cliente porque tiene historial de cursos asociados.' });
        } else {
            res.status(500).json({ message: 'Error al eliminar el cliente', error: err.message });
        }
    } finally {
        // Asegurarse de cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});


app.delete('/delete-membresia/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10); // Obtener el id desde la URL
    let connection;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Llamar al procedimiento almacenado sp_delete_membresia
        await connection.execute(
            `BEGIN super_user.sp_delete_membresia(:id); END;`,
            [id],
            { autoCommit: true }
        );

        // Si se ejecuta correctamente, devolvemos un mensaje de éxito
        res.status(200).json({ status: 'success', message: 'Membresía eliminada correctamente.' });

    } catch (error) {
        console.error('Error al eliminar la membresía:', error);

        // Capturar errores específicos de Oracle y enviarlos al frontend
        if (error.message.includes('ORA-20036')) {
            res.status(404).json({ status: 'error', message: 'La membresía no existe o ya fue eliminada.' });
        } else if (error.message.includes('ORA-20037')) {
            res.status(400).json({ status: 'error', message: 'Error al eliminar la membresía: ' + error.message });
        } else {
            res.status(500).json({ status: 'error', message: 'Error inesperado: ' + error.message });
        }
    } finally {
        // Cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

app.delete('/delete-rutinas/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10); // Obtener el id de la rutina desde la URL
    let connection;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Llamar al procedimiento almacenado eliminar_rutina
        await connection.execute(
            `BEGIN super_user.eliminar_rutina(:id); END;`,
            { id },
            { autoCommit: true }
        );

        // Enviar mensaje de éxito al frontend
        res.status(200).json({ status: 'success', message: 'Rutina eliminada correctamente.' });

    } catch (error) {
        console.error('Error al eliminar la rutina:', error);

        // Capturar errores de Oracle y enviarlos al frontend
        if (error.message.includes('ORA-20037')) {
            res.status(404).json({ status: 'error', message: 'La rutina que desea eliminar no existe.' });
        } else if (error.message.includes('ORA-20038')) {
            res.status(400).json({ status: 'error', message: 'Error al eliminar la rutina: ' + error.message });
        } else {
            res.status(500).json({ status: 'error', message: 'Error inesperado: ' + error.message });
        }
    } finally {
        // Cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});
app.delete('/delete-maquina/:id', async (req, res) => {
    const id_maquina = parseInt(req.params.id, 10); // Obtener el id de la máquina desde la URL
    let connection;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Llamar al procedimiento almacenado eliminar_maquina
        await connection.execute(
            `BEGIN super_user.eliminar_maquina(:id_maquina); END;`,
            { id_maquina },
            { autoCommit: true }
        );

        // Enviar mensaje de éxito al frontend
        res.status(200).json({ status: 'success', message: `Máquina con id ${id_maquina} eliminada correctamente.` });

    } catch (error) {
        console.error('Error al eliminar la máquina:', error);

        // Capturar errores específicos y enviarlos al frontend
        if (error.message.includes('ORA-20041')) {
            res.status(400).json({ status: 'error', message: 'No se puede eliminar la máquina porque está relacionada con registros en la tabla "rutinas".' });
        } else if (error.message.includes('ORA-20042')) {
            res.status(400).json({ status: 'error', message: 'No se puede eliminar la máquina porque está relacionada con registros en la tabla "membresia".' });
        } else if (error.message.includes('ORA-20039')) {
            res.status(404).json({ status: 'error', message: 'La máquina que desea eliminar no existe.' });
        } else if (error.message.includes('ORA-20040')) {
            res.status(400).json({ status: 'error', message: 'Error al eliminar la máquina: ' + error.message });
        } else {
            res.status(500).json({ status: 'error', message: 'Error inesperado: ' + error.message });
        }
    } finally {
        // Cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

app.delete('/delete-cursos/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);

        await connection.execute(
            `BEGIN super_user.eliminar_curso(:id); END;`,
            { id },
            { autoCommit: true }
        );

        res.status(200).json({ status: 'success', message: 'Curso eliminado correctamente.' });

    } catch (error) {
        console.error('Error al eliminar el curso:', error);

        if (error.message.includes('ORA-20044')) {
            res.status(404).json({ status: 'error', message: 'El curso que desea eliminar no existe.' });
        } else if (error.message.includes('ORA-20041')) {
            res.status(400).json({ status: 'error', message: 'No se puede eliminar el curso porque tiene un historial de cursos asociado.' });
        } else {
            res.status(500).json({ status: 'error', message: 'Error inesperado: ' + error.message });
        }
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});


app.delete('/delete-historial-curso/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10); // Obtener el id del historial desde la URL
    let connection;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Llamar al procedimiento almacenado eliminar_historial_curso
        await connection.execute(
            `BEGIN super_user.eliminar_historial_curso(:id); END;`,
            { id },
            { autoCommit: true }
        );

        // Enviar mensaje de éxito al frontend
        res.status(200).json({ status: 'success', message: 'Historial de curso eliminado correctamente.' });

    } catch (error) {
        console.error('Error al eliminar el historial de curso:', error);

        // Capturar errores de Oracle y enviarlos al frontend
        if (error.message.includes('ORA-20046')) {
            res.status(404).json({ status: 'error', message: 'El historial de curso que desea eliminar no existe.' });
        } else if (error.message.includes('ORA-20047')) {
            res.status(400).json({ status: 'error', message: 'Error al eliminar el historial de curso: ' + error.message });
        } else {
            res.status(500).json({ status: 'error', message: 'Error inesperado: ' + error.message });
        }
    } finally {
        // Cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});
app.delete('/delete-trabajador/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10); // Obtener el id del trabajador desde la URL
    let connection;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Llamar al procedimiento almacenado eliminar_trabajador
        await connection.execute(
            `BEGIN super_user.eliminar_trabajador(:id); END;`,
            { id },
            { autoCommit: true }
        );

        // Enviar mensaje de éxito al frontend si el trabajador fue eliminado
        res.status(200).json({ status: 'success', message: 'Trabajador eliminado correctamente.' });

    } catch (error) {
        console.error('Error al eliminar el trabajador:', error);

        // Capturar errores específicos de Oracle y enviarlos al frontend
        if (error.message.includes('ORA-20044')) {
            res.status(404).json({ status: 'error', message: 'El trabajador no existe.' });
        } else if (error.message.includes('ORA-20038')) {
            res.status(409).json({ status: 'error', message: 'No se puede eliminar el trabajador porque tiene rutinas asociadas.' });
        } else if (error.message.includes('ORA-20039')) {
            res.status(409).json({ status: 'error', message: 'No se puede eliminar el trabajador porque tiene un historial de cursos asociado.' });
        } else {
            res.status(500).json({ status: 'error', message: 'Error inesperado: ' + error.message });
        }
    } finally {
        // Cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});



//-------------------------TODOS LOS INSERT-------------------------

// Insertar un curso
app.post('/insertar-curso', async (req, res) => {
    const { descripcion, horario, disponibilidad } = req.body;
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);

        await connection.execute(
            `BEGIN 
                super_user.insertar_curso(:descripcion, :horario, :disponibilidad); 
             END;`,
            {
                descripcion: descripcion,
                horario: horario,
                disponibilidad: disponibilidad
            },
            { autoCommit: true }
        );

        res.json({ message: 'Curso insertado correctamente' });

    } catch (err) {
        console.error('Error al insertar el curso:', err);
        res.status(500).json({ message: 'Error al insertar el curso', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

// Insertar un historial de curso
app.post('/insertar-historial-curso', async (req, res) => {
    const {cliente, id_curso, instructor,  fecha_inscripcion, horas} = req.body;
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);

        await connection.execute(
            `BEGIN 
                super_user.insertar_historial_curso(:id_curso, :cliente, TO_DATE(:fecha_inscripcion, 'YYYY-MM-DD'), :horas, :instructor); 
             END;`,
            {
                id_curso: id_curso,
                cliente: cliente,
                instructor: instructor,
                id_curso: id_curso,
                fecha_inscripcion: fecha_inscripcion,
                horas: horas
            },
            { autoCommit: true }
        );

        res.json({ message: 'Historial de curso insertado correctamente' });

    } catch (err) {
        console.error('Error al insertar el historial de curso:', err);
        res.status(500).json({ message: 'Error al insertar el historial de curso', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

// Insertar un cliente y crear un usuario
app.post('/insertar-cliente-y-crear-usuario', async (req, res) => {
    const { cedula, nombre, apellido1, apellido2, direccion, e_mail, fecha_inscripcion, celular, tel_habitacion, contrasena } = req.body;

    // Asegúrate de que el nombre de usuario cumpla con las reglas de Oracle
    const usuario = `user_${cedula}`;
    let connection;

    try {
        // Establecer la conexión con la base de datos como super_user
        connection = await oracledb.getConnection(dbConfig);

        // Llamar al procedimiento para insertar el cliente
        await connection.execute(
            `BEGIN super_user.insertar_cliente(
                :cedula, :nombre, :apellido1, :apellido2, :direccion, :e_mail, 
                TO_DATE(:fecha_inscripcion, 'YYYY-MM-DD'), :celular, :tel_habitacion
            ); END;`,
            {
                cedula: cedula,
                nombre: nombre,
                apellido1: apellido1,
                apellido2: apellido2,
                direccion: direccion,
                e_mail: e_mail,
                fecha_inscripcion: fecha_inscripcion,
                celular: celular,
                tel_habitacion: tel_habitacion
            }
        );

        // Cerrar la conexión como super_user
        await connection.close();

        // Establecer la conexión con la base de datos como SYSDBA
        connection = await oracledb.getConnection(sysdbaConfig);

        // Llamar al procedimiento para crear el usuario
        await connection.execute(
            `BEGIN
                crear_usuario(:usuario, :contrasena);
            END;`,
            {
                usuario: usuario,
                contrasena: contrasena
            }
        );

        res.status(200).json({ message: 'Cliente y usuario creados exitosamente' });
    } catch (err) {
        console.error('Error al insertar el cliente y crear el usuario:', err);
        res.status(500).json({
            message: 'Error al insertar el cliente y crear el usuario',
            error: err.message
        });
    } finally {
        // Asegurarse de cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});


app.post('/inscribirseFormulario', async (req, res) => {
    const { cedula, nombre, apellido1, apellido2, direccion, e_mail, fecha_inscripcion, celular, tel_habitacion, contrasena, id_curso, instructor, horas } = req.body;

    // Asegúrate de que el nombre de usuario cumpla con las reglas de Oracle
    const usuario = `user_${cedula}`;
    let connection;

    try {
        // Establecer la conexión con la base de datos como super_user
        connection = await oracledb.getConnection(dbConfig);

        // Llamar al procedimiento para insertar el cliente
        await connection.execute(
            `BEGIN super_user.insertar_cliente(
                :cedula, :nombre, :apellido1, :apellido2, :direccion, :e_mail, 
                TO_DATE(:fecha_inscripcion, 'YYYY-MM-DD'), :celular, :tel_habitacion
            ); END;`,
            {
                cedula: cedula,
                nombre: nombre,
                apellido1: apellido1,
                apellido2: apellido2,
                direccion: direccion,
                e_mail: e_mail,
                fecha_inscripcion: fecha_inscripcion,
                celular: celular,
                tel_habitacion: tel_habitacion
            },
            { autoCommit: true } // Hacer commit automáticamente
        );

        // Cerrar la conexión como super_user
        await connection.close();

        // Establecer la conexión con la base de datos como SYSDBA
        connection = await oracledb.getConnection(sysdbaConfig);

        // Llamar al procedimiento para crear el usuario
        await connection.execute(
            `BEGIN
                crear_usuario(:usuario, :contrasena);
            END;`,
            {
                usuario: usuario,
                contrasena: contrasena
            },
            { autoCommit: true } // Hacer commit automáticamente
        );

        // Cerrar la conexión como SYSDBA
        await connection.close();

        // Establecer la conexión con la base de datos como super_user nuevamente
        connection = await oracledb.getConnection(dbConfig);

        // Llamar al procedimiento para insertar el historial de curso
        await connection.execute(
            `BEGIN super_user.insertar_historial_curso(
                :cliente, :id_curso, :instructor, TO_DATE(:fecha_inscripcion, 'YYYY-MM-DD'), :horas
            ); END;`,
            {
                cliente: cedula,
                id_curso: id_curso, // Asigna el ID del curso desde el frontend
                instructor: instructor, // Asigna el ID del instructor desde el frontend
                fecha_inscripcion: fecha_inscripcion,
                horas: horas // Asigna el número de horas desde el frontend
            },
            { autoCommit: true } // Hacer commit automáticamente
        );

        res.status(200).json({ message: 'Cliente, usuario e historial de curso creados exitosamente' });
    } catch (err) {
        console.error('Error al insertar el cliente, crear el usuario o insertar el historial de curso:', err);
        res.status(500).json({
            message: 'Error al insertar el cliente, crear el usuario o insertar el historial de curso',
            error: err.message
        });
    } finally {
        // Asegurarse de cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});



app.post('/insertar-trabajador-y-crear-usuario_trabajador', async (req, res) => {
    const { cod_instructor, nombre, apellido1, apellido2, direccion, e_mail, tel_cel, tel_habitacion, fecha_contratacion, rool, contrasena } = req.body;

    // Asegúrate de que el nombre de usuario cumpla con las reglas de Oracle
    const usuario = `user_${cod_instructor}`;
    let connection;

    try {
        // Establecer la conexión con la base de datos como super_user
        connection = await oracledb.getConnection(dbConfig);

        // Llamar al procedimiento para insertar el trabajador
        await connection.execute(
            `BEGIN super_user.insertar_trabajador(
                :cod_instructor, :nombre, :apellido1, :apellido2, :direccion, :e_mail, 
                :tel_cel, :tel_habitacion, TO_DATE(:fecha_contratacion, 'YYYY-MM-DD'), :rool
            ); END;`,
            {
                cod_instructor: cod_instructor,
                nombre: nombre,
                apellido1: apellido1,
                apellido2: apellido2,
                direccion: direccion,
                e_mail: e_mail,
                tel_cel: tel_cel,
                tel_habitacion: tel_habitacion,
                fecha_contratacion: fecha_contratacion,
                rool: rool
            }
        );

        // Cerrar la conexión como super_user
        await connection.close();

        // Establecer la conexión con la base de datos como SYSDBA
        connection = await oracledb.getConnection(sysdbaConfig);

        // Llamar al procedimiento para crear el usuario
        await connection.execute(
            `BEGIN
                crear_usuario_trabajador(:usuario, :contrasena);
            END;`,
            {
                usuario: usuario,
                contrasena: contrasena
            }
        );

        res.status(200).json({ message: 'Trabajador y usuario creados exitosamente' });
    } catch (err) {
        console.error('Error al insertar el trabajador y crear el usuario:', err);
        res.status(500).json({
            message: 'Error al insertar el trabajador y crear el usuario',
            error: err.message
        });
    } finally {
        // Asegurarse de cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});


app.post('/insert-membresia', async (req, res) => {
    const { id_cliente, monto, estado, fecha } = req.body; // Obtener los datos del cuerpo de la solicitud
    let connection;

    try {
        // Establecer conexión a la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Llamar al procedimiento almacenado para insertar membresía
        await connection.execute(
            `BEGIN super_user.sp_insert_membresia(:id_cliente, :monto, :estado, TO_DATE(:fecha, 'YYYY-MM-DD')); END;`,
            {
                id_cliente,
                monto,
                estado,
                fecha: fecha // Convertir a formato de fecha adecuado
            },
            { autoCommit: true }
        );

        // Enviar respuesta de éxito al cliente
        res.status(200).json({ status: 'success', message: 'Membresía insertada correctamente.' });

    } catch (error) {
        console.error('Error al insertar la membresía:', error);

        // Manejo de errores específicos
        if (error.message.includes('ORA-20002')) {
            res.status(409).json({ status: 'error', message: 'La membresía ya existe.' });
        } else if (error.message.includes('ORA-20003')) {
            res.status(404).json({ status: 'error', message: 'El cliente especificado en la membresía no existe.' });
        } else {
            res.status(500).json({ status: 'error', message: 'Error inesperado: ' + error.message });
        }
    } finally {
        // Cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

// Insertar una máquina
app.post('/insertar-maquina', async (req, res) => {
    const {descripcion, estado, dificultad } = req.body;
    let connection;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Llamar al procedimiento para insertar la máquina
        await connection.execute(
            `BEGIN 
                super_user.insertar_maquina(:descripcion, :estado, :dificultad); 
             END;`,
            {
                descripcion: descripcion,
                estado: estado,
                dificultad: dificultad
            },
            { autoCommit: true }
        );

        res.json({ message: 'Máquina insertada correctamente' });

    } catch (err) {
        console.error('Error al insertar la máquina:', err);
        res.status(500).json({ message: 'Error al insertar la máquina', error: err.message });
    } finally {
        // Asegurarse de cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

// Insertar una rutina
app.post('/insertar-rutina', async (req, res) => {
    const { cliente, instructor, maquina, fecha, horas } = req.body;
    let connection;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Llamar al procedimiento para insertar la rutina
        await connection.execute(
            `BEGIN 
                super_user.insertar_rutina(:cliente, :instructor, :maquina, TO_DATE(:fecha, 'YYYY-MM-DD'), :horas); 
             END;`,
            {
                cliente: cliente,
                instructor: instructor,
                maquina: maquina,
                fecha: fecha,
                horas: horas
            },
            { autoCommit: true }
        );

        res.json({ message: 'Rutina insertada correctamente' });

    } catch (err) {
        console.error('Error al insertar la rutina:', err);
        res.status(500).json({ message: 'Error al insertar la rutina', error: err.message });
    } finally {
        // Asegurarse de cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});

/*****Auditorias*****/


// Ver auditorías
app.get('/ver-auditorias', async (req, res) => {
    let connection;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Ejecutar el procedimiento almacenado
        const result = await connection.execute(
            `BEGIN super_user.ver_auditorias(:cursor); END;`,
            {
                cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } // Definir el cursor de salida
            }
        );

        const cursor = result.outBinds.cursor;
        const rows = await cursor.getRows(); // Obtener las filas del cursor

        // Mapear los resultados a un formato JSON con nombres descriptivos
        const auditorias = rows.map(row => ({
            "Nombre de Usuario": row[0],
            "Nombre OBJ": row[1],
            "Accion": row[2],
            "Fecha y hora": row[3],
            "Codigo de retorno": row[4]
        }));

        res.json(auditorias); // Devolver los datos como un arreglo JSON

    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        res.status(500).send('Error al conectar a la base de datos');
    } finally {
        // Asegurarse de cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});


app.get('/buscar-membresia-cliente/:id_cliente', async (req, res) => {
    let connection;
    const id_cliente = req.params.id_cliente;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);

        // Ejecutar el procedimiento almacenado
        const result = await connection.execute(
            `BEGIN super_user.buscar_membresia_por_cliente(:id_cliente, :cursor); END;`,
            {
                id_cliente: id_cliente, // Parámetro para el procedimiento
                cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } // Definir el cursor de salida
            }
        );

        const cursor = result.outBinds.cursor;
        const rows = await cursor.getRows(); // Obtener las filas del cursor

        // Si se encuentran resultados, formateamos los datos
        if (rows.length > 0) {
            const membresias = rows.map(row => ({
                id: row[0],
                id_cliente: row[1],
                monto: row[2],
                estado: row[3],
                fecha: row[4]
            }));
            res.json(membresias); // Devolver los datos como un arreglo JSON
        } else {
            res.status(404).json({ message: 'No se encontraron membresías para este cliente' });
        }

    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        res.status(500).send('Error al conectar a la base de datos');
    } finally {
        // Asegurarse de cerrar la conexión
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});


// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
