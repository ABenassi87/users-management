import { default as mongoose, Document, Model, Schema } from 'mongoose';

export interface IUserDocument extends Document {
  cantEdit?: boolean;
}

export interface IUserDocumentModel extends Model<IUserDocument> {}

const Types = Schema.Types;
const schema = new Schema({
  canEdit: {
    type: Types.Boolean,
    default: false,
  },
});

export const UserDocument = mongoose.model<IUserDocument>('user_document', schema) as IUserDocumentModel;
