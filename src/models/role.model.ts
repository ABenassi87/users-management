import { default as mongoose, Document, Model, Schema } from 'mongoose';
import * as _ from 'lodash';
import { constants } from '../utilities/constants';

const USER_ROLES = constants.USER_ROLES;

export interface IRole extends Document {
  name: string;
  rank: number;
  description?: string;
}

export interface IRoleModel extends Model<IRole> {}

const Types = Schema.Types;
const schema = new Schema({
  name: {
    type: Types.String,
    enum: _.values(USER_ROLES),
    required: true,
    unique: true,
  },
  rank: {
    type: Types.Number,
    required: true,
    unique: true,
    description:
      'Determines the role\'s position in the hierarchy, with "0" being the highest.',
  },
  description: {
    type: Types.String,
  },
});

schema.statics = {
  routeOptions: {
    /*policies: {
            associatePolicies: [
                rankAuth(mongoose, 'child'),
                permissionAuth(mongoose, false),
                demoAuth
            ],
            updatePolicies: [demoAuth],
            deletePolicies: [demoAuth]
        },*/
    associations: {
      users: {
        type: 'ONE_MANY',
        alias: 'user',
        foreignField: 'role',
        model: 'user',
      },
      permissions: {
        type: 'MANY_MANY',
        alias: 'permission',
        model: 'permission',
        linkingModel: 'role_permission',
      },
    },
  },
};

export const Role = mongoose.model<IRole>('role', schema) as IRoleModel;
