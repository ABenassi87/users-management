import { default as mongoose, Document, Model, Schema } from 'mongoose';
import * as Bcrypt from 'bcryptjs';
import * as Uuid from 'uuid';

export interface ISession extends Document {
  user?: any;
  key: string;
  passwordHash: string;
  createdAt: number;
}

export interface ISessionModel extends Model<ISession> {}

const Types = Schema.Types;
const schema = new Schema({
  user: {
    type: Types.ObjectId,
    ref: 'user',
  },
  key: {
    type: Types.String,
    required: true,
  },
  passwordHash: {
    type: Types.String,
    required: true,
  },
});

schema.statics = {
  enableSoftDelete: false,
  routeOptions: {
    associations: {
      user: {
        type: 'ONE_ONE',
        model: 'user',
      },
    },
  },

  generateKeyHash: async (): Promise<{ key: string; hash: string }> => {
    return new Promise<{key: string, hash: string}>(async (resolve, reject) => {
      try {
        const key: string = Uuid.v4();

        const salt: string = await Bcrypt.genSalt(10);
        const hash: string = await Bcrypt.hash(key, salt);

        resolve({ key, hash });
      } catch (err) {
        reject(err);
      }
    });
  },

  createInstance: async (user): Promise<ISession> => {
    return new Promise<ISession>(async (resolve, reject) => {
      try {
        const document: ISession = {
          user: user._id,
          key: Uuid.v4(),
          passwordHash: user.password,
          createdAt: Date.now(),
          increment
        };

        let newSession = await mongoose.model('session').create(document);

        const query = {
          user: user._id,
          key: { $ne: document.key },
        };

        await mongoose.model('session').findOneAndRemove(query);

        return newSession;
      } catch (err) {
        errorHelper.handleError(err, Log);
      }
    })
  },

  findByCredentials: async (_id: any, key: string): Promise<ISession> => {
    return new Promise<ISession>((resolve, reject) => {
      Session.findById(_id, (err, session: ISession) => {
        if (err) {
          reject(err);
        }
        if (!session || session.key !== key) {
          reject('Session is not found');
        } else {
          resolve(session);
        }
      });
    });
  },
};

export const Session = mongoose.model<ISession>(
  'session',
  schema,
) as ISessionModel;
