package model

import "time"

// QuestionConfig stores the quiz configuration as a JSON blob.
// There is only one active config at a time (singleton pattern, keyed by slug "active").
type QuestionConfig struct {
	Base
	Slug      string    `datastore:"slug"`          // always "active"
	ConfigJSON string   `datastore:"configJson,noindex"` // full quiz mapping as JSON
	UpdatedAt time.Time `datastore:"updatedAt"`
}
