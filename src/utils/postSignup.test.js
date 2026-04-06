import { it, describe, expect } from "vitest";

import { postSignup } from "./postSignup";

describe("postSignUp", () => {
  it("200 response for posting signup form", async () => {
    const data = {
      username: "123hello",
      email: "xc",
      password: "whatsup123U$",
    };
    const res = await postSignup(data)
    expect(res.data).toEqual(data)

  });
});
