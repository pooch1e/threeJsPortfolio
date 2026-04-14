const ENDOINT = 'http://localhost:8081/api/signup'


export const postSignup = async (data) => {
  const {username, email, password} = data;
  const res = await fetch(ENDOINT, {
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