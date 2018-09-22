import { default as mongoose, Document, Model, Schema } from 'mongoose';

export interface IImage extends Document {
  title?: string;
  description?: string;
  imageUrl: string;
  index?: number;
  owner?: any;
}

export interface IImageModel extends Model<IImage> {}

const Types = Schema.Types;
const schema = new Schema({
  title: {
    type: Types.String,
  },
  description: {
    type: Types.String,
  },
  imageUrl: {
    type: Types.String,
    stringType: 'uri',
    required: true,
  },
  index: {
    type: Types.Number,
    allowOnUpdate: false,
    allowOnCreate: false,
  },
  owner: {
    type: Types.ObjectId,
    ref: 'user',
    allowOnUpdate: false,
    allowOnCreate: false,
  },
});

schema.statics = {
  routeOptions: {
    imageScope: {
      rootScope: ['root'],
    },
    authorizeImageCreator: true,
    associations: {
      owner: {
        type: 'MANY_ONE',
        model: 'user',
      },
    },
    create: {
      pre: async (payload: IImage, request, logger): Promise<IImage> => {
        return new Promise<IImage>((resolve, reject) => {
          try {
            payload.owner = request.auth.credentials.user._id;
            Image.find({ owner: payload.owner, $sort: ['index'] }, (err, images: IImage[]) => {
              if (err) {
                reject(err);
              }
              if (images[0]) {
                payload.index = images[0].index + 1;
              } else {
                payload.index = 0;
              }
            });
            resolve(payload);
          } catch (err) {
            reject(err);
          }
        });
      },
    },
  },
};

export const Image = mongoose.model<IImage>('image', schema) as IImageModel;
