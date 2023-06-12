import UserModel from "./user.model";
import token from "@/utils/token";

class UserService {
  private user = UserModel;

  /**
   * Register a new user
  */
  // TODO other methods findById, findByEmail...

 public async register(
  name: string,
  email: string,
  password: string,
  role: string
 ): Promise<boolean | Error> {
  try {
    // TODO chech db for existing user 'this.findByEmail'
    // if(user) throw error
    await this.user.create({
      name,
      email,
      password,
      role,
    });
    
    return true;
  } catch (error: any) {
    // TODO throw new DataBaseError()
    throw new Error('Failed to register user');
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
}

export default UserService;
