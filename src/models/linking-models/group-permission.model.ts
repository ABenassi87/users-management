import { default as mongoose, Document, Model, Schema } from 'mongoose';
import * as _ from 'lodash';
import { constants } from '../../utilities/constants';

const PERMISSION_STATES = constants.PERMISSION_STATES;

export interface IGroupPermission extends Document {
  state?: string;
}

export interface IGroupPermissionModel extends Model<IGroupPermission> {}

const Types = Schema.Types;
const schema = new Schema({
  state: {
    type: Types.String,
    enum: _.values(PERMISSION_STATES),
    required: true,
    default: PERMISSION_STATES.INCLUDED,
  },
});

export const GroupPermission = mongoose.model<IGroupPermission>('group_permission', schema) as IGroupPermissionModel;
