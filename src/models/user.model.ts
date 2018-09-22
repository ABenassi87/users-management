import { default as mongoose, Document, Model, Schema } from 'mongoose';
import * as Bcrypt from 'bcryptjs';
import * as GeneratePassword from 'password-generator';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  title?: string;
  education?: string;
  location?: string;
  bio?: string;
  profileImageUrl?: string;
  role: any;
  isActive: boolean;
  isEnabled: boolean;
  password?: string;
  pin?: string;
  facebookId?: string;
  googleId?: string;
  githubId?: string;
  resetPassword?: {
    hash?: string;
    pinRequired?: boolean;
  };
  activateAccountHash?: string;
  passwordUpdateRequired?: boolean;
  pinUpdateRequired: boolean;
  socialLoginHash?: string;
}

export interface IUserModel extends Model<IUser> {
  generateHash(key: string): Promise<{ key: string; hash: string }>;
  findByCredentials(email: string, password: string): Promise<IUser>;
}

const Types = Schema.Types;
const schema = new Schema({
  firstName: {
    type: Types.String,
    required: true,
  },
  lastName: {
    type: Types.String,
    required: true,
  },
  email: {
    type: Types.String,
    required: true,
    stringType: 'email',
  },
  title: {
    type: Types.String,
  },
  education: {
    type: Types.String,
  },
  location: {
    type: Types.String,
  },
  bio: {
    type: Types.String,
  },
  profileImageUrl: {
    type: Types.String,
    stringType: 'uri',
  },
  role: {
    type: Types.ObjectId,
    ref: 'role',
  },
  isActive: {
    type: Types.Boolean,
    allowOnUpdate: false,
    default: false,
  },
  isEnabled: {
    type: Types.Boolean,
    allowOnUpdate: false,
    default: true,
  },
  password: {
    type: Types.String,
    exclude: true,
    allowOnUpdate: false,
  },
  pin: {
    type: Types.String,
    exclude: true,
    allowOnUpdate: false,
  },
  facebookId: {
    type: Types.String,
    allowOnUpdate: false,
  },
  googleId: {
    type: Types.String,
    allowOnUpdate: false,
  },
  githubId: {
    type: Types.String,
    allowOnUpdate: false,
  },
  resetPassword: {
    hash: {
      type: Types.String,
    },
    pinRequired: {
      type: Types.Boolean,
    },
    allowOnCreate: false,
    allowOnUpdate: false,
    exclude: true,
    type: { hash: Types.String, pinRequired: Types.Boolean },
  },
  activateAccountHash: {
    allowOnCreate: false,
    allowOnUpdate: false,
    exclude: true,
    type: Types.String,
  },
  passwordUpdateRequired: {
    type: Types.Boolean,
    allowOnCreate: false,
    allowOnUpdate: false,
    default: false,
  },
  pinUpdateRequired: {
    type: Types.Boolean,
    allowOnCreate: false,
    allowOnUpdate: false,
    default: false,
  },
  socialLoginHash: {
    allowOnCreate: false,
    allowOnUpdate: false,
    exclude: true,
    type: Types.String,
  },
});

schema.statics = {
  routeOptions: {
    authorizeDocumentCreator: false,
    /*policies: {
      associatePolicies: [
        rankAuth(mongoose, 'ownerId'),
        permissionAuth(mongoose, false),
        groupAuth(mongoose, false),
        demoAuth
      ],
      updatePolicies: [
        rankAuth(mongoose, '_id'),
        promoteAuth(mongoose),
      ],
      deletePolicies: [rankAuth(mongoose, '_id'), demoAuth]
    },*/
    routeScope: {
      // Users can access their own Notifications
      getUserNotificationsScope: 'user-{params.ownerId}',
      // Users can access their own Connections
      getUserConnectionsScope: 'user-{params.ownerId}',
      // Users can access their own Documents
      getUserDocumentsScope: 'user-{params.ownerId}',
      // Users can access their own Shared Documents
      getUserSharedDocumentsScope: 'user-{params.ownerId}',
      // Users can access their own Images
      getUserImagesScope: 'user-{params.ownerId}',
    },
    associations: {
      role: {
        type: 'MANY_ONE',
        model: 'role',
        duplicate: [
          {
            field: 'name',
          },
          {
            field: 'rank',
          },
        ],
      },
      groups: {
        type: 'MANY_MANY',
        alias: 'group',
        model: 'group',
      },
      permissions: {
        type: 'MANY_MANY',
        alias: 'permission',
        model: 'permission',
        linkingModel: 'user_permission',
      },
      connections: {
        type: 'ONE_MANY',
        alias: 'connection',
        foreignField: 'primaryUser',
        model: 'connection',
      },
      conversations: {
        type: 'MANY_MANY',
        alias: 'conversation',
        model: 'conversation',
        linkingModel: 'user_conversation',
      },
      documents: {
        type: 'ONE_MANY',
        alias: 'document',
        foreignField: 'owner',
        model: 'document',
      },
      sharedDocuments: {
        type: 'MANY_MANY',
        alias: 'shared-document',
        model: 'document',
        linkingModel: 'user_document',
      },
      images: {
        type: 'ONE_MANY',
        alias: 'image',
        foreignField: 'owner',
        model: 'image',
      },
      notifications: {
        type: 'ONE_MANY',
        alias: 'notification',
        foreignField: 'primaryUser',
        model: 'notification',
      },
    },
    create: {
      pre: async (payload: IUser, request): Promise<IUser> => {
        return new Promise<IUser>(async (resolve, reject) => {
          try {
            if (!payload.password) {
              payload.password = GeneratePassword(10, false);
            }
            if (!payload.pin) {
              payload.pin = GeneratePassword(4, false, /\d/);
            }

            const promises: Promise<{ key: string; hash: string }>[] = [];

            promises.push(User.generateHash(payload.password));
            promises.push(User.generateHash(payload.pin));
            const result = await Promise.all(promises);
            payload.password = result[0].hash;
            payload.pin = result[1].hash;

            resolve(payload);
          } catch (err) {
            reject(err);
          }
        });
      },
      post: async (document: IUser, request, result, logger): Promise<IUser> => {
        return new Promise<IUser>(async (resolve, reject) => {
          try {
            if (!document.profileImageUrl) {
              const profileImageUrl = 'https://www.gravatar.com/avatar/' + document._id + '?r=PG&d=robohash';
              User.findByIdAndUpdate(document._id, { profileImageUrl }, (err, userUpdated: IUser) => {
                if (err) {
                  reject(err);
                }
                resolve(userUpdated);
              });
            } else {
              resolve(document);
            }
          } catch (err) {
            reject(err);
          }
        });
      },
    },
  },

  generateHash: async (key: string): Promise<{ key: string; hash: string }> => {
    return new Promise<{ key: string; hash: string }>(async (resolve, reject) => {
      try {
        const salt = await Bcrypt.genSalt(10);
        const hash = await Bcrypt.hash(key, salt);
        resolve({ key, hash });
      } catch (err) {
        reject(err);
      }
    });
  },

  findByCredentials: async (email: string, password: string): Promise<IUser> => {
    return new Promise<IUser>(async (resolve, reject) => {
      try {
        const self = this;

        const query = {
          email: email.toLowerCase(),
          isDeleted: false,
        };

        const mongooseQuery = self.findOne(query);

        const user = await mongooseQuery.lean();

        if (!user) {
          reject('User not Found.');
        }

        const source = user.password;

        const passwordMatch = await Bcrypt.compare(password, source);
        if (passwordMatch) {
          resolve(user);
        } else {
          reject('Invalid password.');
        }
      } catch (err) {
        reject(err);
      }
    });
  },
};

export const User = mongoose.model<IUser>('user', schema) as IUserModel;
