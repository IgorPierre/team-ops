package logging

import (
	"io"
	"log/slog"
	"os"
	"strings"
)

func New(level string) *slog.Logger {
	var lvl slog.Level
	switch strings.ToLower(level) {
	case "debug":
		lvl = slog.LevelDebug
	case "warn":
		lvl = slog.LevelWarn
	case "error":
		lvl = slog.LevelError
	default:
		lvl = slog.LevelInfo
	}
	return slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: lvl,
		ReplaceAttr: func(_ []string, a slog.Attr) slog.Attr {
			if a.Key == "database_url" || a.Key == "authorization" || a.Key == "cookie" || a.Key == "token" || a.Key == "password" {
				return slog.Attr{}
			}
			return a
		},
	}))
}

func Discard() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}
