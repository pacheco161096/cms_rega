import type { Schema, Attribute } from '@strapi/strapi';

export interface TicketsActualizacion extends Schema.Component {
  collectionName: 'components_tickets_actualizacions';
  info: {
    displayName: 'actualizacion';
    icon: 'calendar';
    description: '';
  };
  attributes: {
    fecha: Attribute.Date;
    descripcion: Attribute.Text;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'tickets.actualizacion': TicketsActualizacion;
    }
  }
}
