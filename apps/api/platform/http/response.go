package httpx

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/team-ops/api/internal/apperr"
)

type Envelope struct {
	Data  any            `json:"data"`
	Error *ErrorBody     `json:"error"`
	Meta  map[string]any `json:"meta"`
}

type ErrorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func JSON(w http.ResponseWriter, status int, data any, meta map[string]any) {
	if meta == nil {
		meta = map[string]any{}
	}
	write(w, status, Envelope{Data: data, Error: nil, Meta: meta})
}

func Error(w http.ResponseWriter, err error) {
	var ae *apperr.Error
	if errors.As(err, &ae) {
		write(w, ae.Status, Envelope{
			Data:  nil,
			Error: &ErrorBody{Code: ae.Code, Message: ae.Message},
			Meta:  map[string]any{},
		})
		return
	}
	write(w, http.StatusInternalServerError, Envelope{
		Data:  nil,
		Error: &ErrorBody{Code: "INTERNAL", Message: "Internal server error."},
		Meta:  map[string]any{},
	})
}

func Decode(r *http.Request, dest any) error {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dest); err != nil {
		return apperr.New("INVALID_JSON", "Request body is invalid JSON.", http.StatusBadRequest)
	}
	return nil
}

func write(w http.ResponseWriter, status int, body Envelope) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
