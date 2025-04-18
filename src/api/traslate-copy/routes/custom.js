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
    {
      method: "POST",
      path: "/searchUserPayment",
      handler: "traslate-copy.searchUserPayment",
      config: {
        auth:false
      },
    },
    {
      method: "GET",
      path: "/validateMikrotik",
      handler: "traslate-copy.validateMikrotik",
      config: {
        auth:false
      },
    },
  ],
};
