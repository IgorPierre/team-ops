package apperr

import "fmt"

type Error struct {
	Code    string
	Message string
	Status  int
}

func (e *Error) Error() string {
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func New(code, message string, status int) *Error {
	return &Error{Code: code, Message: message, Status: status}
}
