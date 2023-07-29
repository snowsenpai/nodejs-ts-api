import UserModel from "./user.model";
import EmailService from "../email/email.service";
import token from "@/utils/token";
import { TokenData } from "@/utils/interfaces/token.interface";
import { BadRequest, NotFound, Unauthorized } from "@/utils/exceptions/clientErrorResponse";

//*  UserModel should have required security(e.g pass word) and otp fields
//*  UserService should have appropriate methods to mutate and validate a
//*  retrived user object from the database using a unique identifier e.g
//*  user.id; this available to other controllers via middleware req.user.id
class UserService {
  private user = UserModel;
  private EmailService = new EmailService();
  private sensitiveUserFields = ['+password', '+secret_token', '+otp_base32', '+otp_auth_url', '+recovery_codes'];

  /**
   * Register a new user
  */
 public async register(
  name: string,
  email: string,
  password: string,
  role: string
 ): Promise<boolean | Error> {
    const existingUser = await this.user.findOne({ email: email });

    if (existingUser) {
      throw new BadRequest('User already exists');
    }

    const newUser = await this.user.create({
      name,
      email,
      password,
      role,
    });
    if(!newUser) {
      throw new BadRequest('Could not create user');
    }
    this.EmailService.sendWelcomeEmail(email, name);

    return true;
 }

  /**
   * Attempt to login a user
   */
  public async login(
    email: string,
    password: string
  ): Promise<TokenData | Error> {
    const user = await this.findByEmail(email);

    if(await user.isValidPassword(password)) {
      return token.createToken({id: user._id});
    } else {
      throw new Unauthorized('Wrong credentials');
    }
  }

  /**
   * Find all users
   */
  public async findAllUsers() {
    const users = await this.user.find({});
    if(!users){
      throw new NotFound('Unable to find any user');
    }
    return users;
  }

  /**
   * Find a user by email
   */
  public async findByEmail(userEmail: string) {
    const user = await this.user.findOne({email: userEmail}).exec();

    if (!user) {
      throw new NotFound('User does not exist');
    }

    return user;
  }

  /**
   * context: directly checking user.isValidPassword from the user object returned by ofthe service methods
   * will result in `this.password` being `undefined`, even if the password is included in the object
   */
  public async hasValidPassword(userEmail: string, password: string) {
    const user = await this.user.findOne({email: userEmail});

    if (!user) {
      throw new NotFound('User does not exist');
    }

    return await user.isValidPassword(password);
  }

  /**
   * Find a user by id
   */
  public async findById(userId: string) {
    const user = await this.user.findById(userId);
    if(!user){
      throw new NotFound('Unable to find user');
    }
    return user;
  }

  /**
   * getFullUSerById
   * 
   * for authentication process
   */
  public async getFullUSerById(userId: string) {
    const user = await this.user.findById(userId).select(this.sensitiveUserFields);

    if (!user) {
      throw new NotFound('User not found');
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
      throw new NotFound('User not found');
    }
    return user;    
  }

  /**
   * Update a user
   */
  public async updateUser(userId: string, userData: object) {
    const user = await this.user.findByIdAndUpdate(userId, userData, { new: true });
    if (!user) {
      throw new NotFound('User not found');
    }
    return user;
  }

  /**
   * Delete a user
   */
  public async deleteUser(userId: string) {
    const user = await this.user.findByIdAndDelete(userId);
    if (!user) {
      throw new NotFound('User not found');
    }
    return 'User deleted';
  }

  /**
   * Get all posts of a user
   */
  public async getAllPostsOfUser(userId: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFound('User does not exist');
    }
    const posts = await user.populate('posts');

    return posts;
  }
}

export default UserService;
