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

  /**
   * Register a new user
  */
 public async register(
  name: string,
  email: string,
  password: string,
  role: string
 ): Promise<boolean | Error> {
    const existingUser = await this.findByEmail(email);

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
    const user = await this.user.findOne({ email });

    if(!user){
      throw new NotFound('Unable to find user with that email');
    }

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
    const users = await this.user.find({}, '-password');
    if(!users){
      throw new NotFound('Unable to find any user');
    }
    return users;
  }

  /**
   * Find a user by email
   */
  public async findByEmail(userEmail: string) {
    const user = await this.user.findOne({email: userEmail}, '-password').exec();

    return user;
  }

  /**
   * Find a user by id
   */
  public async findById(userId: string) {
    const user = await this.user.findById(userId, '-password');
    if(!user){
      throw new NotFound('Unable to find user');
    }
    return user;
  }

  /**
   * Update a user
   */
  public async updateUser(userId: string, userData: object) {
    const user = await this.user.findByIdAndUpdate(userId, userData, { new: true }).select('-password');
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
