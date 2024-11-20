module.exports = {
  routes: [
    {
      method: "POST",
      path: "/payment",
      handler: "traslate-copy.payment",
      config: {
        auth:false
      },
    },

  ],
};
