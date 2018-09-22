import { default as mongoose, Document, Model, Schema } from 'mongoose';
import { constants } from '../utilities/constants';
import { IUserDocument } from './linking-models/user-document.model';

const NOTIFICATION_TYPES = constants.NOTIFICATION_TYPES;

export interface IDocument extends Document {
  title: string;
  body: string;
  owner: any;
}

export interface IDocumentModel extends Model<IDocument> {
  removeDocumentPermissions(scope, userId): void;
}

const Types = Schema.Types;
const schema = new Schema({
  title: {
    type: Types.String,
    required: true,
  },
  body: {
    type: Types.String,
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
    documentScope: {
      rootScope: ['root'],
    },
    authorizeDocumentCreator: true,
    associations: {
      owner: {
        type: 'MANY_ONE',
        model: 'user',
      },
      users: {
        type: 'MANY_MANY',
        alias: 'user',
        model: 'user',
        linkingModel: 'user_document',
      },
    },
    create: {
      pre: async (payload: IDocument, request): Promise<IDocument> => {
        return new Promise<IDocument>((resolve, reject) => {
          try {
            payload.owner = request.auth.credentials.user._id;
            resolve(payload);
          } catch (err) {
            reject(err);
          }
        });
      },
    },
    add: {
      users: {
        pre: async (payload: IUserDocument[], request): Promise<IDocument> => {
          return new Promise<IDocument>(async (resolve, reject) => {
            try {
              let document = null;
              await Doc.find({owner: request.params.ownerId}, (err, res) => {
                if (err) reject(err);

                document = res;
              });

              const scope = document.scope;
              // Add permissions for shared users to either edit or view the document
              payload.forEach((userDocument: IUserDocument) => {
                // Remove any previous permissions before adding new ones
                Doc.removeDocumentPermissions(scope, userDocument.childId);
                if (userDocument.canEdit) {
                  scope.updateScope = scope.updateScope || [];
                  scope.updateScope.push('user-' + userDocument.childId);
                }
                scope.readScope = scope.readScope || [];
                scope.readScope.push('user-' + userDocument.childId);

                // Create a notification for the user that is gaining access
                let notification = {
                  primaryUser: userDocument.childId,
                  actingUser: document.owner,
                  type: NOTIFICATION_TYPES.SHARED_DOCUMENT,
                };
                Notification.createDocumentNotification(
                  notification,
                  request.server,
                  Log,
                );
              });
              await RestHapi.update(Document, document._id, { scope }, Log);

              return payload;
            } catch (err) {
              errorHelper.handleError(err, Log);
            }
          })

        },
      },
    },
    remove: {
      users: {
        pre: async function(payload, request, Log) {
          try {
            let document = await RestHapi.find(
              Document,
              request.params.ownerId,
              {},
              Log,
            );
            const scope = document.scope;
            const userId = request.params.childId;
            Document.removeDocumentPermissions(scope, userId);
            await RestHapi.update(Document, document._id, { scope }, Log);
            return payload;
          } catch (err) {
            errorHelper.handleError(err, Log);
          }
        },
      },
    },
  },
  removeDocumentPermissions(scope, userId) {
    // Remove document permissions for user
    scope.updateScope = scope.updateScope || [];
    scope.updateScope = scope.updateScope.filter(value => {
      return value !== 'user-' + userId;
    });
    scope.readScope = scope.readScope || [];
    scope.readScope = scope.readScope.filter(value => {
      return value !== 'user-' + userId;
    });
  },
};

export const Doc = mongoose.model<IDocument>(
  'document',
  schema,
) as IDocumentModel;
