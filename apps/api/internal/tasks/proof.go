package tasks

import (
	"net/http"
	"net/url"
	"strings"

	"github.com/team-ops/api/internal/apperr"
)

// Where finished work can be checked. "none" is for work with nothing to
// link: planning, research, a meeting.
const (
	ProofGitHub   = "github"
	ProofVercel   = "vercel"
	ProofSupabase = "supabase"
	ProofOther    = "other"
	ProofNone     = "none"
)

// ProofDTO is a done task's evidence.
type ProofDTO struct {
	Kind string  `json:"kind"`
	URL  *string `json:"url"`
}

// proofInput is the evidence sent when a task moves to done.
type proofInput struct {
	Kind string `json:"kind"`
	URL  string `json:"url"`
}

func proofDTO(kind, link *string) *ProofDTO {
	if kind == nil {
		return nil
	}
	return &ProofDTO{Kind: *kind, URL: link}
}

// checkProof validates the evidence and returns the columns to store
// (both nil when none was sent).
func checkProof(p *proofInput) (kind, link *string, err error) {
	if p == nil || strings.TrimSpace(p.Kind) == "" {
		return nil, nil, nil
	}
	k := strings.ToLower(strings.TrimSpace(p.Kind))
	switch k {
	case ProofNone:
		return &k, nil, nil
	case ProofGitHub, ProofVercel, ProofSupabase, ProofOther:
	default:
		return nil, nil, apperr.New("VALIDATION", "proof.kind must be github, vercel, supabase, other or none.", http.StatusBadRequest)
	}
	raw := strings.TrimSpace(p.URL)
	u, perr := url.Parse(raw)
	if raw == "" || perr != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" {
		return nil, nil, apperr.New("VALIDATION", "proof.url must be an http(s) link to the PR, commit, deploy or page that shows the work.", http.StatusBadRequest)
	}
	return &k, &raw, nil
}

// requireProof refuses moving a task into done without evidence, unless
// it already carries some (a reopened task keeps its last proof).
func requireProof(fromStatus string, existing *string, toStatus string, kind *string) error {
	if toStatus != StatusDone || fromStatus == StatusDone || kind != nil || existing != nil {
		return nil
	}
	return apperr.New(
		"PROOF_REQUIRED",
		"Say where the finished work can be checked: proof.kind github, vercel, supabase or other with proof.url, or none for work with nothing to link (planning, research).",
		http.StatusUnprocessableEntity,
	)
}
