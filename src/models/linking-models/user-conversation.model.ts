import { default as mongoose, Document, Model, Schema } from 'mongoose';

export interface IUserConversation extends Document {
  hasRead?: boolean;
}

export interface IUserConversationModel extends Model<IUserConversation> {}

const Types = Schema.Types;
const schema = new Schema({
  hasRead: {
    type: Types.Boolean,
    required: true,
    default: false,
  },
});

export const UserConversation = mongoose.model<IUserConversation>('user_conversation', schema) as IUserConversationModel;
