import { default as mongoose, Document, Model, Schema } from 'mongoose';
import * as _ from 'lodash';
import { constants } from '../utilities/constants';

const CHAT_TYPES = constants.CHAT_TYPES;
export interface IConversation extends Document {
  name?: string;
  lastMessage?: any;
  chatType: string;
}

export interface IConversationModel extends Model<IConversation> {}

const Types = Schema.Types;
const schema = new Schema({
  name: {
    type: Types.String,
    description: 'The name of the chat.',
  },
  lastMessage: {
    type: Types.ObjectId,
    ref: 'message',
  },
  chatType: {
    type: Types.String,
    required: true,
    enum: _.values(CHAT_TYPES),
  },
});

schema.statics = {
  routeOptions: {
    routeScope: {},
    policies: {},
    associations: {
      lastMessage: {
        type: 'ONE_ONE',
        model: 'message',
      },
      users: {
        type: '_MANY',
        model: 'user',
      },
      userData: {
        type: 'MANY_MANY',
        alias: 'user-data',
        model: 'user',
        linkingModel: 'user_conversation',
      },
      messages: {
        type: 'ONE_MANY',
        alias: 'message',
        foreignField: 'conversation',
        model: 'message',
      },
    },
  },
};

export const Conversation = mongoose.model<IConversation>('conversation', schema) as IConversationModel;
