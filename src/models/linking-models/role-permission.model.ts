import { default as mongoose, Document, Model, Schema } from 'mongoose';
import * as _ from 'lodash';
import { constants } from '../../utilities/constants';

const PERMISSION_STATES = constants.PERMISSION_STATES;

export interface IRolePermission extends Document {
  state?: string;
}

export interface IRolePermissionModel extends Model<IRolePermission> {}

const Types = Schema.Types;
const schema = new Schema({
  state: {
    type: Types.String,
    enum: _.values(PERMISSION_STATES),
    required: true,
    default: PERMISSION_STATES.INCLUDED,
  },
});

export const RolePermission = mongoose.model<IRolePermission>('role_permission', schema) as IRolePermissionModel;
