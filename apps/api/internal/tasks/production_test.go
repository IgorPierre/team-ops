package tasks

import "testing"

func TestProductionCompletion(t *testing.T) {
	if !validStatus(StatusProduction) || !completedStatus(StatusProduction) {
		t.Fatal("production must be a valid completed status")
	}
	if requireProof(StatusInProgress, nil, StatusProduction, nil) == nil {
		t.Fatal("production must require proof like done")
	}
	proof := ProofGitHub
	if err := requireProof(StatusDone, &proof, StatusProduction, nil); err != nil {
		t.Fatal(err)
	}
}
