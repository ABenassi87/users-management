import { default as mongoose, Document, Model, Schema } from 'mongoose';
import * as _ from 'lodash';
import { constants } from '../utilities/constants';
import { IConnection } from './connection.model';
import { IUser, User } from './user.model';

const NOTIFICATION_TYPES = constants.NOTIFICATION_TYPES;

export interface INotification extends Document {
  type?: string;
  hasRead?: boolean;
  primaryUser?: any;
  actingUser?: any;
}

export interface INotificationModel extends Model<INotification> {
  createConnectionNotification(connection: IConnection, connectionPayload: IConnection, server): Promise<void>;
  createDocumentNotification(payload: INotification, server): Promise<void>;
}

const Types = Schema.Types;
const schema = new Schema({
  type: {
    type: Types.String,
    enum: _.values(NOTIFICATION_TYPES),
    required: true,
  },
  hasRead: {
    type: Types.Boolean,
    required: true,
    default: false,
  },
  primaryUser: {
    type: Types.ObjectId,
    ref: 'user',
  },
  actingUser: {
    type: Types.ObjectId,
    ref: 'user',
  },
});

schema.statics = {
  routeOptions: {
    /*policies: {
      // only the primaryUser can update a notification
      updatePolicies: [notificationUpdateAuth(mongoose)],
    },*/
    associations: {
      primaryUser: {
        type: 'MANY_ONE',
        model: 'user',
      },
      actingUser: {
        type: 'ONE_ONE',
        model: 'user',
        // duplicate: ['firstName', 'lastName', 'profileImageUrl']
      },
    },
  },
  /**
   * Create a notification based on a new or updated connection
   * @param connection: used to set the user properties
   * @param connectionPayload: used to determine the notification type
   * @param server
   * @param logger
   */
  async createConnectionNotification(connection: IConnection, connectionPayload: IConnection, server): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const notificationTemp = {
          primaryUser: connection.connectedUser,
          actingUser: connection.primaryUser,
          type: '',
        };
        if (connectionPayload.isContact) {
          notificationTemp.type = NOTIFICATION_TYPES.CONTACT;
        } else if (connectionPayload.isFollowing) {
          notificationTemp.type = NOTIFICATION_TYPES.FOLLOW;
        }
        if (notificationTemp.type) {
          const promises = [];
          promises.push(Notification.create(notificationTemp));
          User.findOne({ _id: notificationTemp.actingUser._id }, (err, user: IUser) => {
            if (err) reject(err);

            promises.push(Promise.resolve(user));
          });
          const result = await Promise.all(promises);
          const notification = result[0];
          notification.actingUser = result[1];
          server.publish('/notification/' + notification.primaryUser, notification);
          resolve();
        }
      } catch (err) {
        reject(err);
      }
    });
  },
  /**
   * Create a notification based on a shared document
   * @param payload: object used to create the notification
   * @param server
   */
  createDocumentNotification(payload: INotification, server): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const promises = [];
        promises.push(Notification.create(payload));
        User.findOne({ _id: payload.actingUser._id }, (err, user: IUser) => {
          if (err) reject(err);

          promises.push(Promise.resolve(user));
        });
        const result = await Promise.all(promises);
        const notification = result[0];
        notification.actingUser = result[1];
        server.publish('/notification/' + notification.primaryUser, notification);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  },
};

export const Notification = mongoose.model<INotification>('notification', schema) as INotificationModel;
