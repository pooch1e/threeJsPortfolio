package utils

func GenerateJwtToken(secret string, userID int) (string, error) {
	t = jwt.New(jwt.SigningMethodHS256)
	s = t.SignedString(key)
}
