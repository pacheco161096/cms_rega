// @ts-ignore
const axios = require('axios');
const https = require('https');
const moment = require('moment');
/**
 * traslate-copy controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::traslate-copy.traslate-copy',({strapi}) => ({
  async payment(ctx) {
    const trx = await strapi.db.transaction(); // Inicia transacción
    try {
      const { idusuario, carshop, metodo } = ctx.request.body;
      let usuario = {};
      if (idusuario) {
          // 1️⃣ Buscar usuario con sus facturas
        usuario = await strapi.entityService.findOne(
          "plugin::users-permissions.user",
          idusuario,
          {
            fields: ["nombre", "apellido", "estatus_servicio", "id_mikrotik", "email", 'idpaquete'],
            populate: { Facturas: { populate: "*" } },
            transaction: trx,
          }
        );
      }

      const paquetes = carshop.filter(item => item.type === "paquete")
      const productos = carshop.filter(item => item.type === "producto");
      let { Facturas } = usuario; // 🔹 Extraemos las facturas
      let newFacturas = [...Facturas]; // 🔹 Copia para evitar modificar el original
      let sinAdeudo = false

      const ventaData = {
        fecha: new Date(), // Fecha de hoy en formato "YYYY-MM-DD"
        tipo: "venta", // "venta" o "salida"
        metodo: metodo, // "tarjeta", "efectivo", etc.
        idusuario: '2', // ID del usuario que hizo la venta
        publishedAt: new Date()
      };

      const nuevaTransaccion = await strapi.entityService.create("api::ventas-salida.ventas-salida", {
        data: ventaData,
        transaction: trx,
      });

      await Promise.all(
        carshop.map(async (item) => {
          await strapi.entityService.create("api::transaccion.transaccion", {
            data: {
              fecha: new Date(),
              idTransaccion: nuevaTransaccion.id,
              idProducto: item.id,
              titulo: item.titulo,
              precio: item.precio,
              cantidad: item.cantidad,
              total: item.precio * item.cantidad,
              type: item.type,
              publishedAt: new Date(),
            },
            transaction: trx,
          });
        })
      );



      if (paquetes.length > 0) {
        let facturasPendientes = newFacturas.filter(factura => !factura.pagado);
        const masReciente = newFacturas.reduce((a, b) =>
          new Date(a.fecha) > new Date(b.fecha) ? a : b
        );
        let fechaMasReciente = newFacturas.length > 0 ? masReciente.fecha : moment().format('YYYY-MM-DD');

        paquetes.forEach(paquete => {
          let cantidad = paquete.cantidad;
          let nextFacturas = []

         if (facturasPendientes.length > 0) {
           // 🔹 Cubrir facturas pendientes con los paquetes disponibles
          for (let i = 0; i <= cantidad && i <= facturasPendientes.length; i++) {
            facturasPendientes[i].pagado = true;
            cantidad = cantidad -1
          }
          // 🔹 Actualizar las facturas originales
          newFacturas = newFacturas.map(factura => ({
            ...factura,
            pagado: facturasPendientes.some(f => f.id === factura.id && f.pagado === true) ? true : factura.pagado,
            idTransaccion: nuevaTransaccion.id,
          }));
         }

         if (cantidad > 0) {
          for (let i = 0; i < cantidad ; i++) {
            newFacturas.push({ fecha: moment(fechaMasReciente).add(i+1, "months").format("YYYY-MM-DD"), pagado: true, id_paquete: usuario.idpaquete, idTransaccion: nuevaTransaccion.id})
          }
         }
        });

        sinAdeudo = newFacturas.every(item => item.pagado === true)
        await strapi.entityService.update(
          "plugin::users-permissions.user",
          idusuario,
          {
            data: {...usuario, Facturas: newFacturas, estatus_servicio: sinAdeudo ? true : false},
          }
        );
      }
      if (usuario.estatus_servicio !== true && sinAdeudo) {
        const httpsAgent = new https.Agent({
          rejectUnauthorized: false,
        })

        const instance = axios.create({
          httpsAgent,
        });

        instance.patch(`https://189.204.159.230:443/rest/ip/firewall/address-list/*${usuario.id_mikrotik}`,
          {
          "disabled": "true"
          }, {
          auth: {
            username: 'noe',
            password: 'RegaTelecom.2024',
          },
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then(response => {
            console.log('Respuesta:', response.data);
          })
          .catch(error => {
            if (error.response) {
              console.error('Error en la respuesta:', error.response.status, error.response.data);
            } else if (error.request) {
              console.error('No se recibió respuesta del servidor:', error);
            } else {
              console.error('Error al configurar la solicitud:', error.message);
            }
          });
      }
      await trx.commit(); // ✅ Confirmar transacción si todo sale bien

      return { ...usuario, pagoexitoso: true};
    } catch (error) {
      console.error('Error en la transacción:', error.message);
      await trx.rollback(); // Revertir si hay error
      ctx.badRequest("Error en el pago", { moreDetails: error.message });
    }
  },
  async searchUserPayment(ctx) {
    try {
      const { idusuario } = ctx.request.body;
      const usuario = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        idusuario,
        {
          fields: ['nombre','apellido', 'estatus_servicio', 'celular', 'email', 'recargo', 'idpaquete'],
          populate: {
            Facturas: {
              populate: '*'
            }
          }
        }
      );

      const { Facturas } = usuario;

      // Filtrar facturas no pagadas
      const filterFacturas = Facturas.filter(factura => !factura.pagado);

      // Resolver Promesas para obtener los paquetes
      const facturaPquetes = await Promise.all(
        filterFacturas.map(async factura => {
          const paquete = await strapi.entityService.findOne(
            "api::paquete.paquete",
            factura.id_paquete,
            {
              fields: ['titulo', 'precio'],
            }
          );
          return {...paquete, fecha: factura.fecha, pagado: factura.pagado, idfactura: factura.id}
        })
      );

      const paqueteActual = await strapi.entityService.findOne(
            "api::paquete.paquete",
            usuario.idpaquete,
            {
              fields: ['titulo', 'precio'],
            }
        )

      return  {
        ...usuario, Facturas: facturaPquetes, paqueteActual
      }
    } catch (error) {
      ctx.badRequest("Post report controller error", { moreDetails: error });
    }
  }
}));

