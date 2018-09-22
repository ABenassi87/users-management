import { default as mongoose, Document, Model, Schema } from 'mongoose';
import * as _ from 'lodash';
import { constants } from '../../utilities/constants';

const PERMISSION_STATES = constants.PERMISSION_STATES;

export interface IUserPermission extends Document {
  state?: string;
}

export interface IUserPermissionModel extends Model<IUserPermission> {}

const Types = Schema.Types;
const schema = new Schema({
  state: {
    type: Types.String,
    enum: _.values(PERMISSION_STATES),
    required: true,
    default: PERMISSION_STATES.INCLUDED,
  },
});

export const UserPermission = mongoose.model<IUserPermission>('user_permission', schema) as IUserPermissionModel;
