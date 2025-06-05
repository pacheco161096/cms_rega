'use strict';

/**
 * caja service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::caja.caja');
