package model

import "time"

type Promotion struct {
	Base
	Name      string    `datastore:"name"`
	Slug      string    `datastore:"slug"`
	Active    bool      `datastore:"active"`
	CreatedAt time.Time `datastore:"createdAt"`
	UpdatedAt time.Time `datastore:"updatedAt"`
}
