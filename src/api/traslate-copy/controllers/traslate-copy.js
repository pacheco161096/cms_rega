// @ts-ignore
const axios = require('axios');
const https = require('https');
/**
 * traslate-copy controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::traslate-copy.traslate-copy',({strapi}) => ({
  async payment(ctx) {
    try {
      const { idusuario, idfactura } = ctx.request.body;
      const usuario = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        idusuario,
        {
          fields: ['nombre','apellido', 'estatus_servicio', 'id_mikrotik'],
          populate: {
            Facturas: {
              populate: '*'
            }
          }
        }
      );
      const { Facturas } = usuario;
      const filterFacturas = (
        Facturas.map(factura => {
          if (factura.id === idfactura ) {
            factura.pagado = true;
          }
          return factura
        })
      );

      await strapi.entityService.update(
        "plugin::users-permissions.user",
        idusuario,
        {
          data: {...usuario, Facturas: filterFacturas, estatus_servicio: true}
        }
      );

      if (usuario.estatus_servicio !== true) {
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

      return  {
        ...usuario, Facturas: filterFacturas
      }
    } catch (error) {
      ctx.badRequest("Post report controller error", { moreDetails: error });
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
          return {...paquete, fecha: factura.fecha, pagado: factura.pagado}
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
  },
  async pay(ctx) {
    const trx = await strapi.db.transaction();

    try {
      const { idusuario, carshop } = ctx.request.body;
      console.log(idusuario, carshop)
      if (!idusuario || !carshop?.length) {
        throw new Error("Datos incompletos");
      }

      // 1️⃣ Buscar usuario y su facturación
      const usuario = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        idusuario,
        {
          fields: ['nombre','apellido', 'estatus_servicio', 'id_mikrotik'],
          populate: {
            Facturas: {
              populate: '*'
            }
          }
        }
      );

      if (!usuario) {
        throw new Error("Usuario no encontrado");
      }
      /*
      // 2️⃣ Separar paquetes y productos
      const paquetes = carshop.filter(item => item.type === "paquete");
      const productos = carshop.filter(item => item.type === "producto");

      // 3️⃣ Actualizar facturas del usuario
      if (paquetes.length) {
        usuario.Facturas.push(...paquetes);
        await strapi.db.query("api::usuario.usuario").update({
          where: { id: idusuario },
          data: { Facturas: usuario.Facturas },
          transaction: trx,
        });
      }

      // 4️⃣ Validar stock y actualizar productos
      for (const prod of productos) {
        const productoDB = await strapi.db.query("api::producto.producto").findOne({
          where: { id: prod.id },
        });

        if (!productoDB || productoDB.stock < prod.cantidad) {
          throw new Error(`Stock insuficiente para el producto ${prod.id}`);
        }

        await strapi.db.query("api::producto.producto").update({
          where: { id: prod.id },
          data: { stock: productoDB.stock - prod.cantidad },
          transaction: trx,
        });
      }

      // 5️⃣ Registrar venta/salida
      /*const ventaSalida = await strapi.db.query("api::ventas-salida.ventas-salida").create({
        data: {
          tipo_transaccion: "venta",
          metodo:'efectivo',
          fecha: new Date()
        },
        transaction: trx,
      });

      // 6️⃣ Registrar transacción
      const transaccion = await strapi.db.query("api::transaccion.transaccion").create({
        data: {
          usuario: idusuario,
          detalles: carshop,
          total: carshop.reduce((acc, item) => acc + item.precio * item.cantidad, 0),
        },
        transaction: trx,
      });*/


      console.log(usuario, 'usuario');
      // 7️⃣ Confirmar cambios en la BD
      // await trx.commit();

      // 9️⃣ Responder éxito*/
      console.log(usuario, 'usuario')
      ctx.send({ message: "Pago registrado y notificación enviada exitosamente" })

    } catch (error) {
      // await trx.rollback();
      ctx.badRequest("Error en el pago", { moreDetails: error.message });
    }
  }
}));

