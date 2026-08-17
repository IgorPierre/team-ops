package auth

import (
	"context"

	"github.com/google/uuid"

	"github.com/team-ops/api/internal/db"
)

type RegistrationMode string

const (
	RegistrationBootstrap  RegistrationMode = "bootstrap"
	RegistrationOpen       RegistrationMode = "open"
	RegistrationInviteOnly RegistrationMode = "invite_only"
)

type InvitePreview struct {
	OrganizationName string
	Role             string
	Email            *string
}

type InviteJoiner interface {
	Redeem(ctx context.Context, q *db.Queries, token, email string, userID uuid.UUID) error
	Peek(ctx context.Context, token string) (InvitePreview, error)
}
