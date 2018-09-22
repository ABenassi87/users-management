import { default as mongoose, Document, Model, Schema } from 'mongoose';
import { Notification } from './notification.model';

export interface IConnection extends Document {
  primaryUser: any;
  connectedUser: any;
  isFollowing?: boolean;
  isFollowed?: boolean;
  isContact?: boolean;
  isSecondary?: boolean;
}

export interface IConnectionModel extends Model<IConnection> {}

const Types = Schema.Types;
const schema = new Schema({
  primaryUser: {
    type: Types.ObjectId,
    ref: 'user',
    allowOnUpdate: false,
    required: true,
  },
  connectedUser: {
    type: Types.ObjectId,
    ref: 'user',
    allowOnUpdate: false,
    required: true,
  },
  isFollowing: {
    type: Types.Boolean,
    default: false,
  },
  isFollowed: {
    type: Types.Boolean,
    default: false,
  },
  isContact: {
    type: Types.Boolean,
    default: false,
  },
});

schema.statics = {
  routeOptions: {
    /*policies: {
      // only the primaryUser can update a connection
      updatePolicies: [connectionUpdateAuth(mongoose)]
    },*/
    associations: {
      primaryUser: {
        type: 'MANY_ONE',
        model: 'user',
      },
      connectedUser: {
        type: 'ONE_ONE',
        model: 'user',
      },
    },
    create: {
      pre: async (payload: IConnection, request): Promise<IConnection> => {
        return new Promise<IConnection>(async (resolve, reject) => {
          try {
            // Connections must be made both ways
            if (!payload.isSecondary) {
              const secondaryPayload = {
                primaryUser: null,
                connectedUser: null,
                isContact: null,
                isFollowing: null,
                isFollowed: null,
                isSecondary: true,
              };
              if (payload.connectedUser) {
                secondaryPayload.primaryUser = payload.connectedUser;
              }
              if (payload.primaryUser) {
                secondaryPayload.connectedUser = payload.primaryUser;
              }
              if (payload.isContact) {
                secondaryPayload.isContact = payload.isContact;
              }
              if (payload.isFollowed) {
                secondaryPayload.isFollowing = payload.isFollowed;
              }
              if (payload.isFollowing) {
                secondaryPayload.isFollowed = payload.isFollowing;
              }
              await Connection.create(secondaryPayload);

              Notification.createConnectionNotification(payload, payload, request.server)
                .then(() => {
                  resolve(payload);
                })
                .catch(err => reject(err));
            } else {
              delete payload.isSecondary;
              resolve(payload);
            }
          } catch (err) {
            reject(err);
          }
        });
      },
    },
    update: {
      pre: async (_id: any, payload: IConnection, request): Promise<IConnection> => {
        return new Promise<IConnection>(async (resolve, reject) => {
          try {
            // Connections must be updated both ways
            if (!payload.isSecondary) {
              const secondaryPayload = {
                primaryUser: null,
                connectedUser: null,
                isContact: null,
                isFollowing: null,
                isFollowed: null,
                isSecondary: true,
              };
              if (payload.connectedUser) {
                secondaryPayload.primaryUser = payload.connectedUser;
              }
              if (payload.primaryUser) {
                secondaryPayload.connectedUser = payload.primaryUser;
              }
              if (payload.isContact) {
                secondaryPayload.isContact = payload.isContact;
              }
              if (payload.isFollowed) {
                secondaryPayload.isFollowing = payload.isFollowed;
              }
              if (payload.isFollowing) {
                secondaryPayload.isFollowed = payload.isFollowing;
              }

              let primaryConnection = null;
              await Connection.findById(_id, (err, result: IConnection) => {
                if (err) reject(err);
                primaryConnection = result;
              });

              if (!primaryConnection) {
                reject('Connection not found.');
              }
              let results = [];
              await Connection.find(
                {
                  primaryUser: primaryConnection.connectedUser,
                  connectedUser: primaryConnection.primaryUser,
                },
                (err, connections: IConnection[]) => {
                  if (err) reject(err);
                  results = connections;
                },
              );

              if (!results[0]) {
                reject('Secondary connection not found.');
              }

              await Connection.update({ _id: results[0]._id }, secondaryPayload, (err, raw) => {
                if (err) reject(err);
              });

              await Notification.createConnectionNotification(primaryConnection, payload, request.server);
              resolve(payload);
            } else {
              delete payload.isSecondary;
              resolve(payload);
            }
          } catch (err) {
            reject(err);
          }
        });
      },
    },
  },
};

export const Connection = mongoose.model<IConnection>('connection', schema) as IConnectionModel;
