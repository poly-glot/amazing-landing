package survey

import (
	"context"
	"sync"
	"time"

	"amazing-landing/internal/model"
	"amazing-landing/internal/repo"

	"cloud.google.com/go/datastore"
)

type ProductRepository struct {
	repo.Store[*model.Product]
	mu      sync.RWMutex
	cache   []*model.Product
	cacheAt time.Time
	cacheTTL time.Duration
}

func NewProductRepository(client *datastore.Client) *ProductRepository {
	return &ProductRepository{
		Store:    repo.Store[*model.Product]{Client: client, Kind: "Product"},
		cacheTTL: 15 * time.Minute,
	}
}

func (r *ProductRepository) ListAll(ctx context.Context) ([]*model.Product, error) {
	return r.FindAll(ctx, r.Query().Order("brand").Order("sortOrder"))
}

func (r *ProductRepository) ListByBrand(ctx context.Context, brand string) ([]*model.Product, error) {
	return r.FindAll(ctx, r.Query().FilterField("brand", "=", brand).Order("sortOrder"))
}

// ListAllCached returns products from a 15-minute in-memory cache.
func (r *ProductRepository) ListAllCached(ctx context.Context) ([]*model.Product, error) {
	r.mu.RLock()
	if r.cache != nil && time.Since(r.cacheAt) < r.cacheTTL {
		result := r.cache
		r.mu.RUnlock()
		return result, nil
	}
	r.mu.RUnlock()

	products, err := r.ListAll(ctx)
	if err != nil {
		return nil, err
	}

	r.mu.Lock()
	r.cache = products
	r.cacheAt = time.Now()
	r.mu.Unlock()

	return products, nil
}

// InvalidateCache forces the next read to hit Firestore.
func (r *ProductRepository) InvalidateCache() {
	r.mu.Lock()
	r.cache = nil
	r.mu.Unlock()
}

type QuestionConfigRepository struct {
	repo.Store[*model.QuestionConfig]
}

func NewQuestionConfigRepository(client *datastore.Client) *QuestionConfigRepository {
	return &QuestionConfigRepository{Store: repo.Store[*model.QuestionConfig]{Client: client, Kind: "QuestionConfig"}}
}

func (r *QuestionConfigRepository) GetActive(ctx context.Context) (*model.QuestionConfig, error) {
	return r.FindOne(ctx, r.Query().FilterField("slug", "=", "active"))
}
