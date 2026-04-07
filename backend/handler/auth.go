package handler

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/galleon/backend/auth"
	"golang.org/x/crypto/bcrypt"
)

// AuthHandler handles login/check/logout endpoints.
type AuthHandler struct {
	passwordHash string // bcrypt hash; empty = auth disabled
	jwtSecret    string
	ttl          time.Duration
}

func NewAuthHandler(passwordHash, jwtSecret string, ttl time.Duration) *AuthHandler {
	return &AuthHandler{
		passwordHash: passwordHash,
		jwtSecret:    jwtSecret,
		ttl:          ttl,
	}
}

// authDisabled returns true when no password is configured (dev mode).
func (h *AuthHandler) authDisabled() bool {
	return h.passwordHash == ""
}

// Handle routes /api/auth/* requests.
func (h *AuthHandler) Handle(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	action := strings.TrimPrefix(r.URL.Path, "/api/auth/")
	switch action {
	case "login":
		if r.Method != http.MethodPost {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}
		h.login(w, r)
	case "check":
		if r.Method != http.MethodGet {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}
		h.check(w, r)
	case "logout":
		w.WriteHeader(http.StatusNoContent)
	default:
		writeError(w, http.StatusNotFound, "not found")
	}
}

func (h *AuthHandler) login(w http.ResponseWriter, r *http.Request) {
	// Dev mode: accept any password.
	if h.authDisabled() {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"expiresAt": time.Now().Add(h.ttl).Unix(),
		})
		return
	}

	var body struct {
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(h.passwordHash), []byte(body.Password)); err != nil {
		writeError(w, http.StatusUnauthorized, "invalid password")
		return
	}

	token, err := auth.IssueToken(h.jwtSecret, h.ttl)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to issue token")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"token":     token,
		"expiresAt": time.Now().Add(h.ttl).Unix(),
	})
}

func (h *AuthHandler) check(w http.ResponseWriter, r *http.Request) {
	// Dev mode: always authenticated.
	if h.authDisabled() {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"ok":        true,
			"expiresAt": time.Now().Add(h.ttl).Unix(),
		})
		return
	}

	expiry, err := extractAndValidateToken(r, h.jwtSecret)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"ok":        true,
		"expiresAt": expiry.Unix(),
	})
}

// RequireAuth is middleware that rejects requests without a valid JWT.
// When auth is disabled (empty jwtSecret or passwordHash), all requests pass through.
func RequireAuth(passwordHash, jwtSecret string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		setCORSHeaders(w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		// Dev mode: no auth required.
		if passwordHash == "" {
			next(w, r)
			return
		}
		if _, err := extractAndValidateToken(r, jwtSecret); err != nil {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		next(w, r)
	}
}

func extractAndValidateToken(r *http.Request, jwtSecret string) (time.Time, error) {
	header := r.Header.Get("Authorization")
	tokenStr := strings.TrimPrefix(header, "Bearer ")
	if tokenStr == "" {
		return time.Time{}, http.ErrNoCookie // reuse sentinel; not exposed
	}
	return auth.ValidateToken(tokenStr, jwtSecret)
}
