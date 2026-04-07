const ENDOINT = 'http://localhost:8080/api/signup'


export const postSignup = async (data) => {
  const {username, email, password} = data;
  try {
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
  } catch (err) {
    throw err
  }

}