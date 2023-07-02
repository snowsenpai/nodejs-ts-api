import UserModel from "./user.model";
import token from "@/utils/token";
import { BadRequest, NotFound, Unauthorized } from "@/utils/exceptions/clientErrorResponse";

//*  UserModel should have required security(e.g pass word) and otp fields
//*  UserService should have appropriate methods to mutate and validate a
//*  retrived user object from the database using a unique identifier e.g
//*  user.id; this available to other controllers via middleware req.user.id
class UserService {
  private user = UserModel;

  /**
   * Register a new user
  */
 public async register(
  name: string,
  email: string,
  password: string,
  role: string
 ): Promise<boolean | Error> {
    const existingUser = await this.findbyEmail(email);

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

    return true;
 }

  /**
   * Attempt to login a user
   */
  public async login(
    email: string,
    password: string
  ): Promise<string | Error> {
    const user = await this.user.findOne({ email });

    if(!user){
      throw new NotFound('Unable to find user with that email');
    }

    if(await user.isValidPassword(password)) {
      return token.createToken(user);
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
  public async findbyEmail(userEmail: string) {
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
