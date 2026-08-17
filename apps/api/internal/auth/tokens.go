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
		return "", "", err
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
		return "", "", "", err
	}
	raw = "tops_sk_" + hex.EncodeToString(buf)
	if len(raw) < 16 {
		return "", "", "", fmt.Errorf("generated key too short")
	}
	prefix = raw[:16]
	hash = HashToken(raw)
	return raw, prefix, hash, nil
}
