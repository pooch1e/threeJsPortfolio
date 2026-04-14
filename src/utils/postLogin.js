const POST_LOGIN_URL = `${import.meta.env.VITE_API_BASE_URL}/api/login`;

export const postLogin = async (data) => {
  const { username, password } = data;
  const res = await fetch(POST_LOGIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.trim() || "Error logging in");
  }

  return res;
};
