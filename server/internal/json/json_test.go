package json_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	appJSON "threejsPortfolioServer/internal/json"
)

func TestWriteJson_StatusCode(t *testing.T) {
	w := httptest.NewRecorder()
	appJSON.WriteJson(w, http.StatusCreated, map[string]string{"key": "val"})
	if w.Code != http.StatusCreated {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusCreated)
	}
}

func TestWriteJson_ContentType(t *testing.T) {
	w := httptest.NewRecorder()
	appJSON.WriteJson(w, http.StatusOK, map[string]string{})
	ct := w.Header().Get("Content-Type")
	if ct != "application/json" {
		t.Errorf("Content-Type: got %q, want %q", ct, "application/json")
	}
}

func TestWriteJson_Body(t *testing.T) {
	type payload struct {
		Name string `json:"name"`
		Age  int    `json:"age"`
	}
	w := httptest.NewRecorder()
	appJSON.WriteJson(w, http.StatusOK, payload{Name: "alice", Age: 30})

	var got payload
	if err := json.NewDecoder(w.Body).Decode(&got); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	if got.Name != "alice" {
		t.Errorf("Name: got %q, want %q", got.Name, "alice")
	}
	if got.Age != 30 {
		t.Errorf("Age: got %d, want %d", got.Age, 30)
	}
}

func TestWriteJson_NilData(t *testing.T) {
	// nil should encode as JSON null without panicking.
	w := httptest.NewRecorder()
	appJSON.WriteJson(w, http.StatusOK, nil)
	if w.Code != http.StatusOK {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusOK)
	}
}
