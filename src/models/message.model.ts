import { default as mongoose, Schema, Document, Model } from 'mongoose';
import { Conversation } from './conversation.model';

export interface IMessage extends Document {
  text: string;
  conversation: any;
  user: any;
}

export interface IMessageModel extends Model<IMessage> {}

const Types = Schema.Types;
const schema = new mongoose.Schema({
  text: {
    type: Types.String,
    required: true,
  },
  conversation: {
    type: Types.ObjectId,
    ref: 'conversation',
    allowOnUpdate: false,
    required: true,
  },
  user: {
    type: Types.ObjectId,
    ref: 'user',
    allowOnUpdate: false,
    required: true,
  },
});

schema.statics = {
  routeOptions: {
    allowCreate: false,
    allowUpdate: false,
    allowAssociate: false,
    policies: {},
    associations: {
      conversation: {
        type: 'MANY_ONE',
        model: 'user',
      },
    },
    create: {
      post: async (document: IMessage): Promise<IMessage> => {
        return new Promise<IMessage>(async (resolve, reject) => {
          try {
            await Conversation.findByIdAndUpdate(document.conversation._id, { lastMessage: document._id }, (err, res) => {
              if (err) reject(err);
            });
            resolve(document);
          } catch (err) {
            reject(err);
          }
        });
      },
    },
  },
};

export const Message = mongoose.model<IMessage>('message', schema) as IMessageModel;
