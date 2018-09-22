import { Document, Model, default as mongoose, Schema } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  description?: string;
}

export interface IGroupModel extends Model<IGroup> {}

const Types = Schema.Types;
const schema = new Schema({
  name: {
    type: Types.String,
    required: true,
    unique: true,
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
                groupAuth(mongoose, true),
                demoAuth
            ],
            updatePolicies: [demoAuth],
            deletePolicies: [demoAuth]
        },*/
    associations: {
      users: {
        type: 'MANY_MANY',
        alias: 'user',
        model: 'user',
      },
      permissions: {
        type: 'MANY_MANY',
        alias: 'permission',
        model: 'permission',
        linkingModel: 'group_permission',
      },
    },
  },
};

export const Group = mongoose.model<IGroup>('group', schema) as IGroupModel;
