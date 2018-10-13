const { io } = require('../server');
const { Usuario } = require('../classes/usuarios');
const { crearMensaje } = require('../utilidades/utilidades');

const usuarios = new Usuario();

io.on('connection', (client) => {

    client.on('entrarChat', (data, callback) => {
        if( !data.nombre || !data.sala) {
            return callback({
                error: true,
                mensaje: 'El nombre y sala son necesarios'
            }); 
        }
        client.join(data.sala);
        usuarios.agregarPersona(client.id, data.nombre, data.sala);
        client.broadcast.to(data.sala).emit('listaPersona', usuarios.getPersonaPorSala(data.data));
        client.broadcast.to(data.data).emit('crearMensaje', crearMensaje('Administrador', `${ data.nombre } se unió chat`));
        callback(usuarios.getPersonaPorSala(data.sala));
    });    

    client.on('crearMensaje', (data, callback) => {
        let persona = usuarios.getPersona(client.id);
        let mensaje = crearMensaje(persona.nombre, data.mensaje);
        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);
        
        callback(mensaje);
    });

    client.on('disconnect', () => {
        let personaBorrada = usuarios.borrarPersona(client.id);
        client.broadcast.to(personaBorrada.data).emit('crearMensaje', crearMensaje('Administrador', `${ personaBorrada.nombre } abandonó el chat`));
        client.broadcast.to(personaBorrada.data).emit('listaPersona', usuarios.getPersonaPorSala(personaBorrada.data));
    });

    client.on('mensajePrivado', data => {
        let persona = usuarios.getPersona(client.id);
        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));
    });

});