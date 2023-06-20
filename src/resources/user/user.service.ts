import UserModel from "./user.model";
import token from "@/utils/token";

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
  try {
    // try Joi.external to validate email before reaching controller
    // UserModel will be used directly, more db calls...
    const existingUser = await this.findbyEmail(email);
    
    if (existingUser) {
      throw new Error('User already exists');
    }

    await this.user.create({
      name,
      email,
      password,
      role,
    });
    
    return true;
  } catch (error: any) {
    // TODO throw new DataBaseError()
    throw new Error(error.message);
  }
 }

  /**
   * Attempt to login a user
   */
  public async login(
    email: string,
    password: string
  ): Promise<string | Error> {
    try {
      const user = await this.user.findOne({ email });

      if(!user){
        throw new Error('Unable to find user with that email');
      }

      if(await user.isValidPassword(password)) {
        return token.createToken(user);
      } else {
        throw new Error('Wrong credentials');
      }

    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Find all users
   */
  public async findAllUsers() {
    const users = await this.user.find({}, '-password');
    if(!users){
      throw new Error('Unable to find any user');
    }
    return users;
  }

  /**
   * Find a user by email
   */
  public async findbyEmail(userEmail: string) {
    const user = await this.user.findOne({email: userEmail}, '-password').exec();
    if(!user){
      throw new Error('Unable to find user with that email');
    }
    return user;
  }

  /**
   * Find a user by id
   */
  public async findById(userId: string) {
    const user = await this.user.findById(userId, '-password');
    if(!user){
      throw new Error('Unable to find user');
    }
    return user;
  }

  /**
   * Update a user
   */
  public async updateUser(userId: string, userData: object) {
    const user = await this.user.findByIdAndUpdate(userId, userData, { new: true });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Delete a user
   */
  public async deleteUser(userId: string) {
    const user = await this.user.findByIdAndDelete(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return 'User deleted';
  }
  
  /**
   * Get all posts of a user
   */
  public async getAllPostsOfUser(userId: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User does not exist');
    }
    const posts = await user.populate('posts');

    return posts;
  }
}

export default UserService;
