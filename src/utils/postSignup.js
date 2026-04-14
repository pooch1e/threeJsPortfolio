const ENDPOINT = `${import.meta.env.VITE_API_BASE_URL}/api/signup`


export const postSignup = async (data) => {
  const {username, email, password} = data;
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username,
      email,
      password
    })
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text.trim())
  }

  return res
}