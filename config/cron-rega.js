const moment = require('moment');
const axios = require('axios');
const https = require('https');
module.exports = {
  /*firstMonth: {
    task: async ({ strapi }) => {
      console.log('Se ejecuta CRON facturas')
      try {
        const usuarios = await strapi.entityService.findMany(
          "plugin::users-permissions.user",
          {
            fields: ['nombre','apellido', 'estatus_servicio', 'celular', 'email', 'recargo', 'idpaquete'],
            populate: {
              Facturas: {
                populate: '*'
              }
            }
          }
        );
        // Recorrer a cada usuario
        for (const usuario of usuarios) {
          const newfacturas = usuario.Facturas || [];

          // Verificar si el usuario tiene facturas
          if (newfacturas.length === 0) {
            // Si no tiene facturas, agregar una factura del mes actual
            const nuevaFactura = {
              fecha: moment().format('YYYY-MM-DD'), // Fecha actual con formato DD/MM/YYYY
              pagado: false, // Puedes ajustar este campo con el monto que desees
              id_paquete: usuario.idpaquete,
            };
            newfacturas.push(nuevaFactura)
            // Agregar la nueva factura al arreglo de facturas del usuario
            // Actualizar el usuario con la nueva factura
            await strapi.entityService.update(
              "plugin::users-permissions.user",
              usuario.id,
              {
                data: { ...usuario, Facturas: newfacturas },
              }
            );
            console.log(`Factura añadida para el usuario ${usuario.id} ${usuario.nombre} ${usuario.apellido} (sin facturas previas)`);
          }  else {
            // Verificar si el usuario ya tiene una factura de este mes
            const facturaExistente = newfacturas.some(factura => {
              // Convertir la fecha de la factura a un objeto moment
              const facturaMonth = moment(factura.fecha).format('YYYY');
              const facturaYear = moment(factura.fecha).format('MM');
              const actualMonth = moment().format('YYYY');
              const actualYear = moment().format('MM');
              // Comparar mes y año
              return facturaMonth === actualMonth && facturaYear === actualYear;
            });

            if (!facturaExistente) {
              // Si no tiene factura del mes actual, crear una nueva factura
              const nuevaFactura = {
                fecha: moment().format('YYYY-MM-DD'), // Fecha actual con formato DD/MM/YYYY
                pagado: false, // Puedes ajustar este campo con el monto que desees
                id_paquete: usuario.idpaquete,
              };

              // Agregar la nueva factura al arreglo de facturas del usuario
              newfacturas.push(nuevaFactura);
              console.log(usuario.id)
              // Actualizar el usuario con la nueva factura
              await strapi.entityService.update(
                "plugin::users-permissions.user",
                usuario.id,
                {
                  data: { ...usuario, Facturas: newfacturas },
                }
              );
              console.log(`Factura añadida para el usuario ${usuario.nombre} ${usuario.apellido}`);
            } else {
              console.log(`El usuario ${usuario.nombre} ${usuario.apellido} ya tiene una factura este mes`);
            }
          }
        }
      } catch (error) {
        console.log('error con los usuarios')
      }

    },
    options: {
      rule: "1 * * * * *"
    }
  },*/
  secondMonth: {
    task: async ({ strapi }) => {
      console.log('Se ejecuta CRON cortes')
      try {
        const usuarios = await strapi.entityService.findMany(
          "plugin::users-permissions.user",
          {
            fields: ['nombre','apellido', 'estatus_servicio', 'celular', 'email', 'recargo', 'idpaquete', 'id_mikrotik'],
            populate: {
              Facturas: {
                populate: '*'
              }
            }
          }
        );
        const usuariosFilter = usuarios
        .filter(usuario =>
          usuario?.Facturas?.some(factura => factura.pagado !== true) &&
          usuario.id_mikrotik !== null
        )
        .map(usuario => `${usuario.id_mikrotik}`);
        console.log(usuariosFilter, 'usuariosFilter')
        try {
          const tokenResponse = await axios.post("http://yg8ss8csc0kcs4c8cs00g4gw.72.60.117.117.sslip.io/auth/login", {
            username: "noe",
            password: "Pacheco.2025",
          });

          const token = tokenResponse.data.access_token;

          // 2. Usamos el token para otra consulta
          const dataResponse = await axios.post(
            "http://yg8ss8csc0kcs4c8cs00g4gw.72.60.117.117.sslip.io/address-list/disabled",
            {
              comments: usuariosFilter,
              disabled: false, // false es para quitarle servicio en mikrotik
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          )
          console.log("Datos:", dataResponse.data);
        } catch (error) {
          console.error("Error en la petición: ERROR DE API", error);
        }
      } catch (error) {
        console.error("Error en la petición: ERROR DE STRAPI", error);
      }
    },
    options: {
      rule: "1 * * * * *"
    }
  }
}
