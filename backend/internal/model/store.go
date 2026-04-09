package model

import "time"

type Store struct {
	Base
	Town      string    `datastore:"town"`
	Address   string    `datastore:"address"`
	Lat       string    `datastore:"lat"`
	Lng       string    `datastore:"lng"`
	Image     string    `datastore:"image"`
	MapLink   string    `datastore:"mapLink"`
	IsActive  bool      `datastore:"isActive"`
	SortOrder int       `datastore:"sortOrder"`
	CreatedAt time.Time `datastore:"createdAt"`
	UpdatedAt time.Time `datastore:"updatedAt"`
}
