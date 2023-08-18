import UserModel from "./user.model";
import EmailService from "../email/email.service";
import { HttpException, HttpStatus } from '@/utils/exceptions/index';

class UserService {
  private user = UserModel;
  private EmailService = new EmailService();
  private sensitiveUserFields = ['+password', '+secretToken', '+otpBase32', '+otpAuthUrl', '+recoveryCodes'];

  /**
   * Register a new user
  */
 public async register(
  firstName: string,
  lastName: string,
  email: string,
  password: string
 ) {
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
      createdNewUserAccount: true
    };
 }

  /**
   * Find all users
   */
  public async findAllUsers() {
    const users = await this.user.find({});
    if(!users.length){
      throw new HttpException(HttpStatus.NOT_FOUND, 'unable to find any user');
    }
    return users;
  }

  /**
   * Find a user by email
   */
  public async findByEmail(userEmail: string) {
    const user = await this.user.findOne({email: userEmail}).exec();

    if (!user) {
      throw new HttpException(HttpStatus.NOT_FOUND, 'user does not exist');
    }

    return user;
  }

  /**
   * Find a user by id
   */
  public async findById(userId: string) {
    const user = await this.user.findById(userId);
    if(!user){
      throw new HttpException(HttpStatus.NOT_FOUND, 'unable to find user');
    }
    return user;
  }

  /**
   * getFullUSerById
   * 
   * for authentication process
   */
  public async getFullUserById(userId: string) {
    const user = await this.user.findById(userId).select(this.sensitiveUserFields);

    if (!user) {
      throw new HttpException(HttpStatus.NOT_FOUND, 'user not found');
    }
    return user;
  }

  /**
   * getFullUserByEmail
   * 
   * for authentication process
   */
  public async getFullUserByEmail(userEmail: string) {
    const user = await this.user.findOne({ email: userEmail }).select(this.sensitiveUserFields);

    if (!user) {
      throw new HttpException(HttpStatus.NOT_FOUND, 'user not found');
    }
    return user;    
  }

  /**
   * Update a user
   */
  public async updateUser(userId: string, userData: object) {
    const user = await this.user.findByIdAndUpdate(userId, userData, { new: true });
    if (!user) {
      throw new HttpException(HttpStatus.NOT_FOUND, 'user not found');
    }
    return user;
  }

  /**
   * Delete a user
   */
  public async deleteUser(userId: string) {
    const user = await this.user.findByIdAndDelete(userId);
    if (!user) {
      throw new HttpException(HttpStatus.NOT_FOUND, 'user not found');
    }
    return {
      deletedUserData: true
    };
  }

  /**
   * Get all posts of a user
   */
  public async getAllPostsOfUser(userId: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new HttpException(HttpStatus.NOT_FOUND, 'user does not exist');
    }
    const posts = await user.populate('posts');

    return posts;
  }
}

export default UserService;
