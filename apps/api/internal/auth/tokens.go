package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
)

func NewSessionToken() (raw string, hash string, err error) {
	buf := make([]byte, 32)
	if _, err = rand.Read(buf); err != nil {
		return "", "", fmt.Errorf("read session token: %w", err)
	}
	raw = hex.EncodeToString(buf)
	return raw, HashToken(raw), nil
}

func HashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

func NewAPIKey() (raw, prefix, hash string, err error) {
	buf := make([]byte, 24)
	if _, err = rand.Read(buf); err != nil {
		return "", "", "", fmt.Errorf("read api key: %w", err)
	}
	raw = "tops_sk_" + hex.EncodeToString(buf)
	if len(raw) < 16 {
		return "", "", "", fmt.Errorf("generated key too short")
	}
	prefix = raw[:16]
	hash = HashToken(raw)
	return raw, prefix, hash, nil
}

func NewInviteToken() (raw, hash string, err error) {
	buf := make([]byte, 24)
	if _, err = rand.Read(buf); err != nil {
		return "", "", fmt.Errorf("read invite token: %w", err)
	}
	raw = "tops_inv_" + hex.EncodeToString(buf)
	return raw, HashToken(raw), nil
}

// DefaultAgentScopes is what an agent can do on the board: read and write
// tasks and comments, read projects and organizations. Nothing administrative.
var DefaultAgentScopes = []string{
	"tasks:read",
	"tasks:create",
	"tasks:update",
	"tasks:move",
	"tasks:comment",
	"tasks:complete",
	"projects:read",
	"organizations:read",
}

// Prefixes make leaked secrets recognizable (and greppable by secret scanners).
const (
	OAuthCodePrefix    = "tops_ac_"
	OAuthAccessPrefix  = "tops_at_"
	OAuthRefreshPrefix = "tops_rt_"
)

// NewOpaqueToken returns a random token with the given prefix and its SHA-256 hash.
func NewOpaqueToken(prefix string) (raw, hash string, err error) {
	buf := make([]byte, 32)
	if _, err = rand.Read(buf); err != nil {
		return "", "", fmt.Errorf("read token: %w", err)
	}
	raw = prefix + hex.EncodeToString(buf)
	return raw, HashToken(raw), nil
}
