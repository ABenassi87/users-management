import { default as mongoose, Document, Model, Schema } from 'mongoose';

export interface IVisitor extends Document {
  ip: string;
  browser: string;
  country_code?: string;
  country_name?: string;
  region_code?: string;
  region_name?: string;
  city?: string;
  zip_code?: string;
  time_zone?: string;
  latitude?: number;
  longitude?: number;
  metro_code?: number;
}

export interface IVisitorModel extends Model<IVisitor> {}

const Types = Schema.Types;
const schema = new Schema({
  ip: {
    type: Types.String,
    required: true,
  },
  browser: {
    type: Types.String,
    required: true,
  },
  country_code: {
    type: Types.String,
  },
  country_name: {
    type: Types.String,
  },
  region_code: {
    type: Types.String,
  },
  region_name: {
    type: Types.String,
  },
  city: {
    type: Types.String,
  },
  zip_code: {
    type: Types.String,
  },
  time_zone: {
    type: Types.String,
  },
  latitude: {
    type: Types.Number,
  },
  longitude: {
    type: Types.Number,
  },
  metro_code: {
    type: Types.Number,
  },
});

schema.statics = {
  routeOptions: {
    policies: {},
    associations: {},
    allowCreate: false,
    allowUpdate: false,
    allowDelete: false,
  },
};

export const Visitor = mongoose.model<IVisitor>('visitor', schema) as IVisitorModel;
