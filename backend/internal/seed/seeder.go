package seed

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"time"

	"amazing-landing/internal/model"

	"cloud.google.com/go/datastore"
	"golang.org/x/crypto/bcrypt"
)

type Seeder struct {
	client   *datastore.Client
	demoMode bool
}

func NewSeeder(client *datastore.Client, demoMode bool) *Seeder {
	return &Seeder{client: client, demoMode: demoMode}
}

type seedStore struct {
	Town      string `json:"town"`
	Address   string `json:"address"`
	Lat       string `json:"lat"`
	Lng       string `json:"lng"`
	Image     string `json:"image"`
	MapLink   string `json:"mapLink"`
	IsActive  bool   `json:"isActive"`
	SortOrder int    `json:"sortOrder"`
}

type seedPromotion struct {
	Name   string `json:"name"`
	Slug   string `json:"slug"`
	Active bool   `json:"active"`
}

type seedAdmin struct {
	Email    string `json:"email"`
	Name     string `json:"name"`
	Password string `json:"password"`
}

type seedProduct struct {
	Brand     string `json:"brand"`
	Name      string `json:"name"`
	Type      string `json:"type"`
	Image     string `json:"image"`
	Price     string `json:"price"`
	URL       string `json:"url"`
	SortOrder int    `json:"sortOrder"`
}

func (s *Seeder) Seed(ctx context.Context) error {
	q := datastore.NewQuery("SeedMarker").Limit(1)
	var markers []*model.SeedMarker
	if keys, err := s.client.GetAll(ctx, q, &markers); err == nil && len(keys) > 0 {
		slog.Info("seed data already exists, skipping")
		return nil
	}

	if err := s.seedStores(ctx); err != nil {
		return fmt.Errorf("seeding stores: %w", err)
	}
	if err := s.seedPromotions(ctx); err != nil {
		return fmt.Errorf("seeding promotions: %w", err)
	}
	if err := s.seedAdmins(ctx); err != nil {
		return fmt.Errorf("seeding admins: %w", err)
	}
	if err := s.seedProducts(ctx); err != nil {
		return fmt.Errorf("seeding products: %w", err)
	}
	if err := s.seedQuestions(ctx); err != nil {
		return fmt.Errorf("seeding questions: %w", err)
	}

	marker := &model.SeedMarker{SeededAt: time.Now()}
	if _, err := s.client.Put(ctx, datastore.IncompleteKey("SeedMarker", nil), marker); err != nil {
		return fmt.Errorf("saving seed marker: %w", err)
	}

	slog.Info("seed data created successfully")
	return nil
}

func (s *Seeder) seedStores(ctx context.Context) error {
	data, err := os.ReadFile("seed/stores.json")
	if err != nil {
		return fmt.Errorf("reading stores.json: %w", err)
	}

	var stores []seedStore
	if err := json.Unmarshal(data, &stores); err != nil {
		return fmt.Errorf("parsing stores.json: %w", err)
	}

	now := time.Now()
	for _, st := range stores {
		entity := &model.Store{
			Town:      st.Town,
			Address:   st.Address,
			Lat:       st.Lat,
			Lng:       st.Lng,
			Image:     st.Image,
			MapLink:   st.MapLink,
			IsActive:  st.IsActive,
			SortOrder: st.SortOrder,
			CreatedAt: now,
			UpdatedAt: now,
		}
		if _, err := s.client.Put(ctx, datastore.IncompleteKey("Store", nil), entity); err != nil {
			return fmt.Errorf("saving store %s: %w", st.Town, err)
		}
	}
	slog.Info("seeded stores", "count", len(stores))
	return nil
}

func (s *Seeder) seedPromotions(ctx context.Context) error {
	data, err := os.ReadFile("seed/promotions.json")
	if err != nil {
		return fmt.Errorf("reading promotions.json: %w", err)
	}

	var promotions []seedPromotion
	if err := json.Unmarshal(data, &promotions); err != nil {
		return fmt.Errorf("parsing promotions.json: %w", err)
	}

	now := time.Now()
	for _, p := range promotions {
		entity := &model.Promotion{
			Name:      p.Name,
			Slug:      p.Slug,
			Active:    p.Active,
			CreatedAt: now,
			UpdatedAt: now,
		}
		if _, err := s.client.Put(ctx, datastore.IncompleteKey("Promotion", nil), entity); err != nil {
			return fmt.Errorf("saving promotion %s: %w", p.Name, err)
		}
	}
	slog.Info("seeded promotions", "count", len(promotions))
	return nil
}

func (s *Seeder) seedAdmins(ctx context.Context) error {
	data, err := os.ReadFile("seed/admin.json")
	if err != nil {
		return fmt.Errorf("reading admin.json: %w", err)
	}

	var admins []seedAdmin
	if err := json.Unmarshal(data, &admins); err != nil {
		return fmt.Errorf("parsing admin.json: %w", err)
	}

	now := time.Now()
	for _, a := range admins {
		hash, err := bcrypt.GenerateFromPassword([]byte(a.Password), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("hashing password for %s: %w", a.Email, err)
		}
		entity := &model.AdminUser{
			Email:              a.Email,
			PasswordHash:       string(hash),
			Name:               a.Name,
			MustChangePassword: !s.demoMode,
			CreatedAt:          now,
		}
		if _, err := s.client.Put(ctx, datastore.IncompleteKey("AdminUser", nil), entity); err != nil {
			return fmt.Errorf("saving admin %s: %w", a.Email, err)
		}
	}
	slog.Info("seeded admins", "count", len(admins))
	return nil
}

func (s *Seeder) seedQuestions(ctx context.Context) error {
	data, err := os.ReadFile("seed/questions.json")
	if err != nil {
		return fmt.Errorf("reading questions.json: %w", err)
	}
	var raw json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return fmt.Errorf("parsing questions.json: %w", err)
	}
	entity := &model.QuestionConfig{
		Slug:       "active",
		ConfigJSON: string(data),
		UpdatedAt:  time.Now(),
	}
	if _, err := s.client.Put(ctx, datastore.IncompleteKey("QuestionConfig", nil), entity); err != nil {
		return fmt.Errorf("saving question config: %w", err)
	}
	slog.Info("seeded question config")
	return nil
}

func (s *Seeder) seedProducts(ctx context.Context) error {
	data, err := os.ReadFile("seed/products.json")
	if err != nil {
		return fmt.Errorf("reading products.json: %w", err)
	}

	var products []seedProduct
	if err := json.Unmarshal(data, &products); err != nil {
		return fmt.Errorf("parsing products.json: %w", err)
	}

	now := time.Now()
	for _, p := range products {
		entity := &model.Product{
			Brand:     p.Brand,
			Name:      p.Name,
			Type:      p.Type,
			Image:     p.Image,
			Price:     p.Price,
			URL:       p.URL,
			SortOrder: p.SortOrder,
			CreatedAt: now,
			UpdatedAt: now,
		}
		if _, err := s.client.Put(ctx, datastore.IncompleteKey("Product", nil), entity); err != nil {
			return fmt.Errorf("saving product %s: %w", p.Name, err)
		}
	}
	slog.Info("seeded products", "count", len(products))
	return nil
}
