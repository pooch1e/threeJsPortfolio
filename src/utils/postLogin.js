const POST_LOGIN_URL = "http://localhost:8081/api/login";

export const postLogin = async (data) => {
  const { username, password } = data;
  try {
    const res = await fetch(POST_LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    if (!res.ok) {
      throw new Error('Error posting signup')
    }
    return res
  } catch (err) {
    throw new Error('Error posting signup', err)
  }
};
