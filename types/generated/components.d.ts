import type { Schema, Attribute } from '@strapi/strapi';

export interface FacturaFactura extends Schema.Component {
  collectionName: 'components_factura_facturas';
  info: {
    displayName: 'Factura';
    description: '';
  };
  attributes: {
    fecha: Attribute.Date;
    pagado: Attribute.Boolean;
    id_paquete: Attribute.String;
  };
}

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
      'factura.factura': FacturaFactura;
      'tickets.actualizacion': TicketsActualizacion;
    }
  }
}
