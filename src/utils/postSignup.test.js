import { it, describe, expect } from "vitest";
import { postSignup } from "./postSignup";

describe("postSignUp", () => {
  it("200 response for posting signup form", async () => {
    const data = {
      username: "123hello",
      email: "123@gmail.com",
      password: "whatsup123U$",
    };
    const result = await postSignup(data);
    console.log(result)
    const { body } = result;
    expect(body).toBe({ message: "posted succesfully", status: 201 });
  });
});
