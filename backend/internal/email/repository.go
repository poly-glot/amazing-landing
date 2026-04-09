package email

import (
	"amazing-landing/internal/model"
	"amazing-landing/internal/repo"

	"cloud.google.com/go/datastore"
)

type Repository struct {
	repo.Store[*model.EmailRecord]
}

func NewRepository(client *datastore.Client) *Repository {
	return &Repository{Store: repo.Store[*model.EmailRecord]{Client: client, Kind: "EmailRecord"}}
}
