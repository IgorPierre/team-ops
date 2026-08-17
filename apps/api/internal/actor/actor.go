package actor

import (
	"context"

	"github.com/google/uuid"
)

type Type string

const (
	TypeUser   Type = "user"
	TypeAgent  Type = "agent"
	TypeSystem Type = "system"
)

type Role string

const (
	RoleAdmin     Role = "admin"
	RoleDeveloper Role = "developer"
	RoleViewer    Role = "viewer"
)

type Actor struct {
	Type           Type
	ID             uuid.UUID
	OrganizationID *uuid.UUID
	DeveloperID    *uuid.UUID
	Role           Role
	Scopes         []string
	Name           string
	Email          string
}

func (a Actor) IsUser() bool  { return a.Type == TypeUser }
func (a Actor) IsAgent() bool { return a.Type == TypeAgent }

func (a Actor) HasScope(scope string) bool {
	if a.IsUser() {
		return true
	}
	for _, s := range a.Scopes {
		if s == scope || s == "*" {
			return true
		}
	}
	return false
}

func (a Actor) CanWriteTasks() bool {
	if a.IsAgent() {
		return a.HasScope("tasks:update") || a.HasScope("tasks:create") || a.HasScope("tasks:move")
	}
	return a.Role == RoleAdmin || a.Role == RoleDeveloper
}

func (a Actor) CanManageOrg() bool {
	if a.IsAgent() {
		return false
	}
	return a.Role == RoleAdmin
}

func (a Actor) IsViewer() bool {
	return a.IsUser() && a.Role == RoleViewer
}

type ctxKey struct{}

func With(ctx context.Context, a Actor) context.Context {
	return context.WithValue(ctx, ctxKey{}, a)
}

func From(ctx context.Context) (Actor, bool) {
	a, ok := ctx.Value(ctxKey{}).(Actor)
	return a, ok
}

func Must(ctx context.Context) Actor {
	a, ok := From(ctx)
	if !ok {
		return Actor{Type: TypeSystem}
	}
	return a
}
