package auth

import (
	"context"

	"amazing-landing/internal/model"
	"amazing-landing/internal/repo"

	"cloud.google.com/go/datastore"
)

type AdminUserRepository struct {
	repo.Store[*model.AdminUser]
}

func NewAdminUserRepository(client *datastore.Client) *AdminUserRepository {
	return &AdminUserRepository{Store: repo.Store[*model.AdminUser]{Client: client, Kind: "AdminUser"}}
}

func (r *AdminUserRepository) FindByEmail(ctx context.Context, email string) (*model.AdminUser, error) {
	return r.FindOne(ctx, r.Query().FilterField("email", "=", email))
}

func (r *AdminUserRepository) Save(ctx context.Context, user *model.AdminUser) (*model.AdminUser, error) {
	return r.Store.Save(ctx, user)
}

func (r *AdminUserRepository) ListAll(ctx context.Context) ([]*model.AdminUser, error) {
	return r.FindAll(ctx, r.Query().Order("email"))
}
