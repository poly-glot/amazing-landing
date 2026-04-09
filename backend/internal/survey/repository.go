package survey

import (
	"context"
	"fmt"

	"amazing-landing/internal/model"
	"amazing-landing/internal/repo"

	"cloud.google.com/go/datastore"
	"google.golang.org/api/iterator"
)

type PromotionRepository struct {
	repo.Store[*model.Promotion]
}

func NewPromotionRepository(client *datastore.Client) *PromotionRepository {
	return &PromotionRepository{Store: repo.Store[*model.Promotion]{Client: client, Kind: "Promotion"}}
}

func (r *PromotionRepository) FindBySlug(ctx context.Context, slug string) (*model.Promotion, error) {
	return r.FindOne(ctx, r.Query().FilterField("slug", "=", slug))
}

func (r *PromotionRepository) ListAll(ctx context.Context) ([]*model.Promotion, error) {
	return r.FindAll(ctx, r.Query().Order("name"))
}

type StoreRepository struct {
	repo.Store[*model.Store]
}

func NewStoreRepository(client *datastore.Client) *StoreRepository {
	return &StoreRepository{Store: repo.Store[*model.Store]{Client: client, Kind: "Store"}}
}

func (r *StoreRepository) ListActive(ctx context.Context) ([]*model.Store, error) {
	return r.FindAll(ctx, r.Query().FilterField("isActive", "=", true).Order("sortOrder"))
}

func (r *StoreRepository) ListAll(ctx context.Context) ([]*model.Store, error) {
	return r.FindAll(ctx, r.Query().Order("sortOrder"))
}

type SubmissionRepository struct {
	repo.Store[*model.Submission]
}

func NewSubmissionRepository(client *datastore.Client) *SubmissionRepository {
	return &SubmissionRepository{Store: repo.Store[*model.Submission]{Client: client, Kind: "Submission"}}
}

func (r *SubmissionRepository) ListRecent(ctx context.Context, limit int) ([]*model.Submission, error) {
	return r.FindAll(ctx, r.Query().Order("-createdAt").Limit(limit))
}

func (r *SubmissionRepository) ListAll(ctx context.Context) ([]*model.Submission, error) {
	return r.FindAll(ctx, r.Query().Order("-createdAt"))
}

// ListPaginated returns a page of submissions with cursor-based pagination.
// Returns the submissions and the cursor string for the next page.
func (r *SubmissionRepository) ListPaginated(ctx context.Context, pageSize int, cursorStr string) ([]*model.Submission, string, error) {
	q := r.Query().Order("-createdAt").Limit(pageSize)

	if cursorStr != "" {
		cursor, err := datastore.DecodeCursor(cursorStr)
		if err != nil {
			return nil, "", fmt.Errorf("invalid cursor: %w", err)
		}
		q = q.Start(cursor)
	}

	var results []*model.Submission
	it := r.Client.Run(ctx, q)
	for {
		var sub model.Submission
		key, err := it.Next(&sub)
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, "", fmt.Errorf("iterating submissions: %w", err)
		}
		sub.SetID(key.ID)
		results = append(results, &sub)
	}

	nextCursor, err := it.Cursor()
	if err != nil {
		return results, "", nil
	}

	nextStr := ""
	if len(results) == pageSize {
		nextStr = nextCursor.String()
	}

	return results, nextStr, nil
}
