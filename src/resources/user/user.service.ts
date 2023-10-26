import UserModel from './user.model';
import EmailService from '../email/email.service';
import { HttpException, HttpStatus } from '@/utils/exceptions/index';

/**
 * Encapsulates methods for interacting with the database to facilitate read, write,
 * create and destroy operations on `users`.
 */
class UserService {
  /**
   * Database intermediary for `users`
   */
  private user = UserModel;
  private EmailService = new EmailService();
  private sensitiveUserFields = [
    '+password',
    '+secretToken',
    '+otpBase32',
    '+otpAuthUrl',
    '+recoveryCodes',
  ];

  /**
   * Creates a new user document.
   *
   * Users have a default role of `"user"`,
   * a welcome email is sent to the created user's email.
   * @param firstName - User's first name.
   * @param lastName - User's last name.
   * @param email - User's email.
   * @param password - User's password.
   * @throws HttpException (400) if an existing user with an identical email is found in the database.
   */
  public async register(firstName: string, lastName: string, email: string, password: string) {
    const existingUser = await this.user.findOne({ email: email });

    if (existingUser) {
      throw new HttpException(HttpStatus.BAD_REQUEST, 'user already exists');
    }
    const role = 'user';

    await this.user.create({
      firstName,
      lastName,
      email,
      password,
      role,
    });

    this.EmailService.sendWelcomeEmail(email, firstName);

    return {
      createdNewUserAccount: true,
    };
  }

  /**
   * Returns an array of all existing user documents in the database.
   * @throws HttpException (404) if no user is found.
   */
  public async findAllUsers() {
    const users = await this.user.find({});
    if (!users.length) {
      throw new HttpException(HttpStatus.NOT_FOUND, 'unable to find any user');
    }
    return users;
  }

  /**
   * Returns a user document with an email field matching the given `userEmail`,
   * by default sensitive user credentials are excluded.
   * @param userEmail - User email to search for.
   * @throws HttpException (404) if no match is found.
   */
  public async findByEmail(userEmail: string) {
    const user = await this.user.findOne({ email: userEmail }).exec();
    if (!user) {
      throw new HttpException(HttpStatus.NOT_FOUND, 'user does not exist');
    }
    return user;
  }

  /**
   * Returns a user document with an id field matching the given `userId`,
   * by default sensitive user credentials are excluded.
   * @param userId - User id to search for.
   * @throws HttpException (404) if no match is found.
   */
  public async findById(userId: string) {
    const user = await this.user.findById(userId);
    if (!user) {
      throw new HttpException(HttpStatus.NOT_FOUND, 'unable to find user');
    }
    return user;
  }

  /**
   * Returns a user document with an id field matching the given `userId`,
   * including sensitive user credentials, intended for user authentication processes.
   *
   * `Ensure that the return value is never exposed to the client`.
   * @param userId - User id to search for.
   * @throws HttpException (404) if no match is found.
   */
  public async getFullUserById(userId: string) {
    const user = await this.user.findById(userId).select(this.sensitiveUserFields);

    if (!user) {
      throw new HttpException(HttpStatus.NOT_FOUND, 'user not found');
    }
    return user;
  }

  /**
   * Returns a user document with an email field matching the given `userEmail`,
   * including sensitive user credentials, intended for user authentication processes.
   *
   * `Ensure that the return value is never exposed to the client`.
   * @param userEmail - The user email to search for.
   * @throws HttpException (404) if no match is found.
   */
  public async getFullUserByEmail(userEmail: string) {
    const user = await this.user.findOne({ email: userEmail }).select(this.sensitiveUserFields);

    if (!user) {
      throw new HttpException(HttpStatus.NOT_FOUND, 'user not found');
    }
    return user;
  }

  /**
   * Updates a single user document that match the given `userId`.
   *
   * `userData` should be the user field and it's new data,
   * data type of the field must match the original data type.
   * @param userId - User id to search for.
   * @param userData - The field(s) to update.
   * @throws HttpException (404) if no match is found.
   */
  public async updateUser(userId: string, userData: object) {
    const user = await this.user.findByIdAndUpdate(userId, userData, { new: true });
    if (!user) {
      throw new HttpException(HttpStatus.NOT_FOUND, 'user not found');
    }
    return user;
  }

  /**
   * Deletes a single user document that match the given `userId`.
   * @param userId - User id to search for.
   * @throws HttpException (404) if no match is found.
   */
  public async deleteUser(userId: string) {
    const user = await this.user.findByIdAndDelete(userId);
    if (!user) {
      throw new HttpException(HttpStatus.NOT_FOUND, 'user not found');
    }
    return {
      deletedUserData: true,
    };
  }

  /**
   * Adds a posts field containing an array of the user's posts for a user document with an id field matching the given `userId`.
   * @param userId - User id to search for.
   */
  public async getAllPostsOfUser(userId: string) {
    const user = await this.findById(userId);

    const posts = await user.populate('posts');
    // fix: posts could be empty, create a flag using .populated() then throw
    return posts;
  }
}

export default UserService;
