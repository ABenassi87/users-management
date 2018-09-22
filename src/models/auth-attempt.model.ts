import { default as mongoose, Document, Model, Schema } from 'mongoose';
import { constants } from '../utilities/constants';

const Types = Schema.Types;

export interface IAuthAttempt extends Document {
  username: string;
  ip: string;
  timeCreated: Date;
}

export interface IAuthAttemptModel extends Model<IAuthAttempt> {
  createInstance(ip: string, username: string): Promise<IAuthAttempt>;
  abuseDetected(ip: string, username: string): Promise<boolean>;
}
const schema = new Schema({
  username: {
    type: Types.String,
    required: true,
  },
  ip: {
    type: Types.String,
    required: true,
  },
  timeCreated: {
    type: Types.Date,
    required: true,
    default: new Date(),
  },
});

schema.static('createInstance', (ip: string, username: string) => {
  return new Promise<IAuthAttempt>(async (resolve, reject) => {
    const doc = { ip, username };
    try {
      const instance = await AuthAttempt.create(doc);
      resolve(instance);
    } catch (e) {
      reject(e);
    }
  });
});

schema.static('abuseDetected', (ip: string, username: string) => {
  return new Promise<boolean>(async (resolve, reject) => {
    try {
      const LOCKOUT_PERIOD = constants.LOCKOUT_PERIOD;
      const expirationDate = LOCKOUT_PERIOD
        ? { $gt: Date.now() - LOCKOUT_PERIOD * 60000 }
        : { $lt: Date.now() };

      const query = {
        ip,
        timeCreated: expirationDate,
      };

      const abusiveIpCount = await AuthAttempt.count(query);
      const query2 = {
        ip,
        username: username.toLowerCase(),
        timeCreated: expirationDate,
      };

      const abusiveIpUserCount = await AuthAttempt.count(query2);

      const AUTH_ATTEMPTS = constants.AUTH_ATTEMPTS;
      const ipLimitReached = abusiveIpCount >= AUTH_ATTEMPTS.FOR_IP;
      const ipUserLimitReached =
        abusiveIpUserCount >= AUTH_ATTEMPTS.FOR_IP_AND_USER;

      resolve(ipLimitReached || ipUserLimitReached);
    } catch (e) {
      reject(e);
    }
  });
});

export const AuthAttempt = mongoose.model<IAuthAttempt>(
  'auth_attempt',
  schema,
) as IAuthAttemptModel;
