module.exports = {
  routes: [
    {
      method: "POST",
      path: "/ordenes/pay",
      handler: "ordenes.pay",
      config: {
        auth: false, // Cambia a true si necesitas autenticación
      },
    },
  ],
};
