import express from 'express';
import oracledb from 'oracledb';
import cors from 'cors';  //npm install express oracledb...

const app = express();
const port = 3000;

// Configuración de la conexión a la base de datos
const dbConfig = {
    user: 'system',
    password: 'root',
    connectString: 'localhost:1521/XEPDB1' // Aquí usas el SID
};

// Habilitar CORS para todas las solicitudes
app.use(cors());

app.use(express.json());

//--------------------Todos los buscar individual------------------------------------

//Busca cliente por cedula
app.get('/buscar-cliente/:cedula', async (req, res) => {
    let connection;

    const cedula = req.params.cedula;

    try {
        // Establecer la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);
        console.log('Conexión exitosa a la base de datos.');

        // Ejecutar el procedimiento almacenado
        const result = await connection.execute(
            `BEGIN super_user.buscar_cliente(:cedula, :cursor); END;`,
            {
                cedula: cedula, // Parámetro para el procedimiento
                cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } // Definir el cursor de salida
            }
        );

        const cursor = result.outBinds.cursor;
        const rows = await cursor.getRows(); // Obtener las filas del cursor

        // Si se encuentran resultados, formateamos los datos
        if (rows.length > 0) {
            const cliente = {
                cedula: rows[0][0],
                nombre: rows[0][1],
                apellido1: rows[0][2],
                apellido2: rows[0][3],
                direccion: rows[0][4],
                e_mail: rows[0][5],
                fecha_inscripcion: rows[0][6],
                celular: rows[0][7],
                tel_habitacion: rows[0][8]
            };
            res.json(cliente); // Devolver los datos como un objeto JSON
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
                tel_habitacion: row[8],
                curso: row[9],
                id_rutina: row[10],
                nombre_instructor: row[11]
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
        connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
            `BEGIN 
                super_user.actualizar_rutina(:id_rutina, :cliente, :instructor, :maquina, 
                                TO_DATE(:fecha, 'YYYY-MM-DD'), :horas, :resultado); 
             END;`,
            {
                id_rutina: id_rutina,
                cliente: cliente,
                instructor: instructor,
                maquina: maquina,
                fecha: fecha,
                horas: horas,
                resultado: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            }
        );

        // Verificar el resultado del procedimiento
        if (result.outBinds.resultado === 1) {
            res.json({ message: 'Rutina actualizada con éxito' });
        } else {
            res.status(404).json({ message: 'Rutina no encontrada' });
        }

    } catch (err) {
        console.error('Error al actualizar la rutina:', err);
        res.status(500).json({ message: 'Error al actualizar la rutina', error: err.message });
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

app.put('/actualizar-historial-curso', async (req, res) => {
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

//-------------------------TODOS LOS INSERT-------------------------

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
