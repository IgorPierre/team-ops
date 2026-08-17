package database

import (
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

const uniqueViolation = "23505"

// IsUniqueViolation reports whether err is a PostgreSQL unique_violation.
func IsUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == uniqueViolation
}

// IsNoRows reports whether err is pgx.ErrNoRows, including wrapped errors.
func IsNoRows(err error) bool {
	return errors.Is(err, pgx.ErrNoRows)
}
