package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const tokenKey = "galleon-admin"

// IssueToken creates a signed JWT valid for the given duration.
func IssueToken(jwtSecret string, ttl time.Duration) (string, error) {
	now := time.Now()
	claims := jwt.RegisteredClaims{
		Subject:   tokenKey,
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret))
}

// ValidateToken verifies the JWT signature and expiry.
// Returns the expiry time on success.
func ValidateToken(tokenStr, jwtSecret string) (time.Time, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &jwt.RegisteredClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(jwtSecret), nil
	})
	if err != nil {
		return time.Time{}, err
	}
	claims, ok := token.Claims.(*jwt.RegisteredClaims)
	if !ok || !token.Valid {
		return time.Time{}, errors.New("invalid token")
	}
	if claims.ExpiresAt == nil {
		return time.Time{}, errors.New("token has no expiry")
	}
	return claims.ExpiresAt.Time, nil
}
