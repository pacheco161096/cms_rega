

module.exports = (plugin) => {
  plugin.controllers.user.payment = (ctx) => {
      try {
        const { idusuario, idfactura } = ctx.request.body;
        ctx.params.id = idusuario;
        const user = plugin.controllers.user.findOne(ctx,{populate: '*'});
        console.log(ctx)
      } catch (error) {
        ctx.badRequest("Post report controller error", { moreDetails: error });
      }
  }

  plugin.routes['content-api'].routes.push({
      method: 'POST',
      path: '/payment',
      handler: 'user.payment'
  });

  return plugin;
}
