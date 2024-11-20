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
  }
}));

