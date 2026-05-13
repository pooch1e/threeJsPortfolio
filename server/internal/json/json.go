package json

import (
	"encoding/json"
	"net/http"
)

func WriteJson(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// WriteError writes a JSON {"error": msg} body with the given status code.
// Use this instead of http.Error so error responses are always JSON.
func WriteError(w http.ResponseWriter, status int, msg string) {
	WriteJson(w, status, map[string]string{"error": msg})
}
