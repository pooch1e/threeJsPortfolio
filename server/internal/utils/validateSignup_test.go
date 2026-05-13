package utils_test

import (
	"testing"

	"threejsPortfolioServer/internal/utils"
)

func TestValidateUsername(t *testing.T) {
	tests := []struct {
		name      string
		input     string
		wantClean string
		wantErr   bool
	}{
		{"valid lowercase", "joel", "joel", false},
		{"uppercase converted to lower", "Joel", "joel", false},
		{"numbers allowed", "joel123", "joel123", false},
		{"all numbers", "123", "123", false},
		{"at-sign rejected", "jo@el", "", true},
		{"hyphen rejected", "jo-el", "", true},
		{"space rejected", "jo el", "", true},
		{"empty rejected", "", "", true},
		{"mixed case converted", "JoEl", "joel", false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			clean, errMsg := utils.ValidateUsername(tt.input)
			if tt.wantErr {
				if errMsg == "" {
					t.Errorf("ValidateUsername(%q): expected error, got none", tt.input)
				}
			} else {
				if errMsg != "" {
					t.Errorf("ValidateUsername(%q): unexpected error %q", tt.input, errMsg)
				}
				if clean != tt.wantClean {
					t.Errorf("ValidateUsername(%q): got %q, want %q", tt.input, clean, tt.wantClean)
				}
			}
		})
	}
}

func TestValidateEmail(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{"valid", "user@example.com", false},
		{"valid subdomain", "user@mail.example.com", false},
		{"missing @", "userexample.com", true},
		{"missing TLD", "user@example", true},
		{"empty", "", true},
		{"just @", "@", true},
		{"no local part", "@example.com", true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, errMsg := utils.ValidateEmail(tt.input)
			if tt.wantErr && errMsg == "" {
				t.Errorf("ValidateEmail(%q): expected error, got none", tt.input)
			}
			if !tt.wantErr && errMsg != "" {
				t.Errorf("ValidateEmail(%q): unexpected error %q", tt.input, errMsg)
			}
		})
	}
}

func TestValidatePasswordRules(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{"valid", "Test1ng@", false},
		{"exactly 8 valid", "Aa1@bcde", false},
		{"too short", "T1@a", true},
		{"no lowercase", "TEST1234@", true},
		{"no uppercase", "test1234@", true},
		{"no digit", "Testing@@", true},
		{"no special char", "Testing123", true},
		{"empty", "", true},
		{"7 chars otherwise valid", "Test1@a", true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errMsg := utils.ValidatePasswordRules(tt.input)
			if tt.wantErr && errMsg == "" {
				t.Errorf("ValidatePasswordRules(%q): expected error, got none", tt.input)
			}
			if !tt.wantErr && errMsg != "" {
				t.Errorf("ValidatePasswordRules(%q): unexpected error %q", tt.input, errMsg)
			}
		})
	}
}

func TestHashPassword_NonEmpty(t *testing.T) {
	hash, err := utils.HashPassword("Test1ng@")
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}
	if len(hash) == 0 {
		t.Fatal("expected non-empty hash")
	}
}

func TestHashPassword_DifferentCallsDifferentHashes(t *testing.T) {
	// bcrypt salts each hash — same input must produce different hashes.
	h1, _ := utils.HashPassword("Test1ng@")
	h2, _ := utils.HashPassword("Test1ng@")
	if string(h1) == string(h2) {
		t.Error("bcrypt should produce different hashes for the same input")
	}
}

func TestCheckPasswordHash_Match(t *testing.T) {
	password := "Test1ng@"
	hash, err := utils.HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}
	if !utils.CheckPasswordHash(password, string(hash)) {
		t.Error("CheckPasswordHash: correct password should match hash")
	}
}

func TestCheckPasswordHash_Mismatch(t *testing.T) {
	hash, err := utils.HashPassword("Test1ng@")
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}
	if utils.CheckPasswordHash("WrongPass1@", string(hash)) {
		t.Error("CheckPasswordHash: wrong password should not match hash")
	}
}
