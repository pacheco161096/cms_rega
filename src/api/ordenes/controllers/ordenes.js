"use strict";

module.exports = {
  async pay(ctx) {
    //const trx = await strapi.db.transaction();

    try {
      const { idusuario, carshop, tipo_transaccion } = ctx.request.body;

      if (!idusuario || !carshop?.length) {
        throw new Error("Datos incompletos o tipo de transacción inválido");
      }

      // Obtener usuario y facturas
      const usuario = await strapi.db.query("plugin::users-permissions.user").findOne({
        where: { id: idusuario },
        populate: ["Facturas"],
      });

      if (!usuario) throw new Error("Usuario no encontrado");
      console.log(usuario)
      /*
      // Separar paquetes y productos
      const paquetes = carshop.filter(item => item.tipo === "paquete");
      const productos = carshop.filter(item => item.tipo === "producto");

      // Actualizar facturas si hay paquetes
      if (paquetes.length) {
        usuario.Facturas.push(...paquetes);
        await strapi.db.query("api::usuario.usuario").update({
          where: { id: idusuario },
          data: { Facturas: usuario.Facturas },
          transaction: trx,
        });
      }

      // Validar y actualizar stock de productos
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

      // Registrar transacción
      const transaccion = await strapi.db.query("api::transaccion.transaccion").create({
        data: {
          usuario: idusuario,
          detalles: carshop,
          total: carshop.reduce((acc, item) => acc + item.precio * item.cantidad, 0),
        },
        transaction: trx,
      });

      // Registrar venta/salida
      await strapi.db.query("api::ventas_salidas.ventas_salidas").create({
        data: {
          usuario: idusuario,
          transaccion: transaccion.id,
          tipo_transaccion, // "venta" o "salida"
          fecha: new Date(),
        },
        transaction: trx,
      });

      // Confirmar la transacción
      await trx.commit();

      // Enviar notificación por correo
      try {
        await strapi.plugin("email").service("email").send({
          to: usuario.email,
          subject: "¡Compra confirmada!",
          text: `Hola ${usuario.nombre}, tu compra ha sido confirmada.`,
          html: `<p>Hola ${usuario.nombre},</p><p>Tu compra ha sido confirmada.</p>`,
        });
      } catch (error) {
        console.error("Error enviando notificación:", error);
      }*/

      ctx.send({ message: "Pago registrado y notificación enviada exitosamente" });

    } catch (error) {
      // await trx.rollback();
      ctx.badRequest("Error en el pago", { moreDetails: error.message });
    }
  },
};
