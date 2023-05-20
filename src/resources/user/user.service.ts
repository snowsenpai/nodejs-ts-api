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
 ): Promise<void | Error> {
  try {
    // TODO return a confirmation message
    await this.user.create({
      name,
      email,
      password,
      role,
    });
  } catch (error) {
    if(error instanceof Error){
      throw new Error(error.message);
    }  
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
        throw new Error('Wrong credentials were given');
      }

    } catch (error) {
      throw new Error('Unable to login user');
    }
  }  
}

export default UserService;
