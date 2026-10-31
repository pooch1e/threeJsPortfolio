type SignupRequest = {
  username: string;
  email: string;
  password: string;
}
export function signupModel(req: Request, res: Response) {
  // clean and validate username, email, password
  // call signupController with details
  // handle errors or pass to next

  const body = req.body;
  
}