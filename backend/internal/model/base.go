package model

import "amazing-landing/internal/repo"

// Base provides the common Datastore ID field for all entities.
type Base struct {
	ID int64 `datastore:"-"`
}

func (b *Base) GetID() int64  { return b.ID }
func (b *Base) SetID(id int64) { b.ID = id }

// Compile-time assertions.
var (
	_ repo.Entity = (*Promotion)(nil)
	_ repo.Entity = (*Store)(nil)
	_ repo.Entity = (*Submission)(nil)
	_ repo.Entity = (*EmailRecord)(nil)
	_ repo.Entity = (*AdminUser)(nil)
	_ repo.Entity = (*SeedMarker)(nil)
	_ repo.Entity = (*Product)(nil)
	_ repo.Entity = (*QuestionConfig)(nil)
)
