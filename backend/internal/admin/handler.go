package admin

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"amazing-landing/internal/auth"
	"amazing-landing/internal/model"
	"amazing-landing/internal/survey"

	"golang.org/x/crypto/bcrypt"
	"golang.org/x/sync/errgroup"
)

type RenderFunc = auth.RenderFunc

type Handler struct {
	promotions  *survey.PromotionRepository
	stores      *survey.StoreRepository
	submissions *survey.SubmissionRepository
	products    *survey.ProductRepository
	questions   *survey.QuestionConfigRepository
	adminUsers  *auth.AdminUserRepository
	flashes     *auth.FlashStore
	render      RenderFunc
}

func NewHandler(
	promotions *survey.PromotionRepository,
	stores *survey.StoreRepository,
	submissions *survey.SubmissionRepository,
	products *survey.ProductRepository,
	questions *survey.QuestionConfigRepository,
	adminUsers *auth.AdminUserRepository,
	flashes *auth.FlashStore,
	render RenderFunc,
) *Handler {
	return &Handler{
		promotions:  promotions,
		stores:      stores,
		submissions: submissions,
		products:    products,
		questions:   questions,
		adminUsers:  adminUsers,
		flashes:     flashes,
		render:      render,
	}
}

// Dashboard

func (h *Handler) Dashboard(w http.ResponseWriter, r *http.Request) {
	var (
		storeCount   int
		promoCount   int
		subCount     int
		productCount int
		recent       []*model.Submission
	)

	g, ctx := errgroup.WithContext(r.Context())
	g.Go(func() error {
		var err error
		storeCount, err = h.stores.Count(ctx, h.stores.Query())
		return err
	})
	g.Go(func() error {
		var err error
		promoCount, err = h.promotions.Count(ctx, h.promotions.Query().FilterField("active", "=", true))
		return err
	})
	g.Go(func() error {
		var err error
		subCount, err = h.submissions.Count(ctx, h.submissions.Query())
		return err
	})
	g.Go(func() error {
		var err error
		productCount, err = h.products.Count(ctx, h.products.Query())
		return err
	})
	g.Go(func() error {
		var err error
		recent, err = h.submissions.ListRecent(ctx, 10)
		return err
	})
	if err := g.Wait(); err != nil {
		slog.Error("dashboard queries failed", "error", err)
	}

	h.render(w, r, "admin/dashboard.html", map[string]any{
		"StoreCount":      storeCount,
		"PromoCount":      promoCount,
		"SubmissionCount": subCount,
		"ProductCount":    productCount,
		"Recent":          recent,
	})
}

// Stores

func (h *Handler) ListStores(w http.ResponseWriter, r *http.Request) {
	stores, err := h.stores.ListAll(r.Context())
	if err != nil {
		slog.Error("listing stores", "error", err)
	}
	h.render(w, r, "admin/stores.html", map[string]any{"Stores": stores})
}

func (h *Handler) NewStoreForm(w http.ResponseWriter, r *http.Request) {
	h.render(w, r, "admin/store-form.html", map[string]any{"Store": &model.Store{IsActive: true}})
}

func (h *Handler) CreateStore(w http.ResponseWriter, r *http.Request) {
	store, err := h.parseStoreForm(r)
	if err != nil {
		h.render(w, r, "admin/store-form.html", map[string]any{"Store": store, "Error": err.Error()})
		return
	}
	now := time.Now()
	store.CreatedAt = now
	store.UpdatedAt = now

	if _, err := h.stores.Save(r.Context(), store); err != nil {
		slog.Error("creating store", "error", err)
		h.render(w, r, "admin/store-form.html", map[string]any{"Store": store, "Error": "Failed to create store"})
		return
	}
	h.flash(r, "success", "Store created successfully")
	http.Redirect(w, r, "/admin/stores", http.StatusFound)
}

func (h *Handler) EditStoreForm(w http.ResponseWriter, r *http.Request) {
	store := h.findStore(w, r)
	if store == nil {
		return
	}
	h.render(w, r, "admin/store-form.html", map[string]any{"Store": store})
}

func (h *Handler) UpdateStore(w http.ResponseWriter, r *http.Request) {
	existing := h.findStore(w, r)
	if existing == nil {
		return
	}
	store, err := h.parseStoreForm(r)
	if err != nil {
		h.render(w, r, "admin/store-form.html", map[string]any{"Store": store, "Error": err.Error()})
		return
	}
	store.SetID(existing.GetID())
	store.CreatedAt = existing.CreatedAt
	store.UpdatedAt = time.Now()

	if _, err := h.stores.Save(r.Context(), store); err != nil {
		slog.Error("updating store", "error", err)
		h.render(w, r, "admin/store-form.html", map[string]any{"Store": store, "Error": "Failed to update store"})
		return
	}
	h.flash(r, "success", "Store updated successfully")
	http.Redirect(w, r, "/admin/stores", http.StatusFound)
}

func (h *Handler) DeleteStore(w http.ResponseWriter, r *http.Request) {
	id := h.parseID(r)
	if id == 0 {
		http.NotFound(w, r)
		return
	}
	if err := h.stores.Delete(r.Context(), id); err != nil {
		slog.Error("deleting store", "error", err)
	}
	h.flash(r, "success", "Store deleted")
	http.Redirect(w, r, "/admin/stores", http.StatusFound)
}

func (h *Handler) ToggleStore(w http.ResponseWriter, r *http.Request) {
	store := h.findStore(w, r)
	if store == nil {
		return
	}
	store.IsActive = !store.IsActive
	store.UpdatedAt = time.Now()
	if _, err := h.stores.Save(r.Context(), store); err != nil {
		slog.Error("toggling store", "error", err)
	}
	http.Redirect(w, r, "/admin/stores", http.StatusFound)
}

// Promotions

func (h *Handler) ListPromotions(w http.ResponseWriter, r *http.Request) {
	promos, err := h.promotions.ListAll(r.Context())
	if err != nil {
		slog.Error("listing promotions", "error", err)
	}
	h.render(w, r, "admin/promotions.html", map[string]any{"Promotions": promos})
}

func (h *Handler) NewPromotionForm(w http.ResponseWriter, r *http.Request) {
	h.render(w, r, "admin/promotion-form.html", map[string]any{"Promotion": &model.Promotion{Active: true}})
}

func (h *Handler) CreatePromotion(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	now := time.Now()
	promo := &model.Promotion{
		Name:      r.FormValue("name"),
		Slug:      r.FormValue("slug"),
		Active:    r.FormValue("active") == "on",
		CreatedAt: now,
		UpdatedAt: now,
	}
	if _, err := h.promotions.Save(r.Context(), promo); err != nil {
		slog.Error("creating promotion", "error", err)
		h.render(w, r, "admin/promotion-form.html", map[string]any{"Promotion": promo, "Error": "Failed to create promotion"})
		return
	}
	h.flash(r, "success", "Promotion created successfully")
	http.Redirect(w, r, "/admin/promotions", http.StatusFound)
}

func (h *Handler) EditPromotionForm(w http.ResponseWriter, r *http.Request) {
	id := h.parseID(r)
	promo, err := h.promotions.FindByID(r.Context(), id, &model.Promotion{})
	if err != nil || promo == nil {
		http.NotFound(w, r)
		return
	}
	h.render(w, r, "admin/promotion-form.html", map[string]any{"Promotion": promo})
}

func (h *Handler) UpdatePromotion(w http.ResponseWriter, r *http.Request) {
	id := h.parseID(r)
	existing, err := h.promotions.FindByID(r.Context(), id, &model.Promotion{})
	if err != nil || existing == nil {
		http.NotFound(w, r)
		return
	}
	if err := r.ParseForm(); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	existing.Name = r.FormValue("name")
	existing.Slug = r.FormValue("slug")
	existing.Active = r.FormValue("active") == "on"
	existing.UpdatedAt = time.Now()

	if _, err := h.promotions.Save(r.Context(), existing); err != nil {
		slog.Error("updating promotion", "error", err)
		h.render(w, r, "admin/promotion-form.html", map[string]any{"Promotion": existing, "Error": "Failed to update"})
		return
	}
	h.flash(r, "success", "Promotion updated successfully")
	http.Redirect(w, r, "/admin/promotions", http.StatusFound)
}

func (h *Handler) DeletePromotion(w http.ResponseWriter, r *http.Request) {
	id := h.parseID(r)
	if id == 0 {
		http.NotFound(w, r)
		return
	}
	if err := h.promotions.Delete(r.Context(), id); err != nil {
		slog.Error("deleting promotion", "error", err)
	}
	h.flash(r, "success", "Promotion deleted")
	http.Redirect(w, r, "/admin/promotions", http.StatusFound)
}

func (h *Handler) TogglePromotion(w http.ResponseWriter, r *http.Request) {
	id := h.parseID(r)
	promo, err := h.promotions.FindByID(r.Context(), id, &model.Promotion{})
	if err != nil || promo == nil {
		http.NotFound(w, r)
		return
	}
	promo.Active = !promo.Active
	promo.UpdatedAt = time.Now()
	if _, err := h.promotions.Save(r.Context(), promo); err != nil {
		slog.Error("toggling promotion", "error", err)
	}
	http.Redirect(w, r, "/admin/promotions", http.StatusFound)
}

// Submissions (read-only)

func (h *Handler) ListSubmissions(w http.ResponseWriter, r *http.Request) {
	subs, err := h.submissions.ListAll(r.Context())
	if err != nil {
		slog.Error("listing submissions", "error", err)
	}
	h.render(w, r, "admin/submissions.html", map[string]any{"Submissions": subs})
}

func (h *Handler) SubmissionDetail(w http.ResponseWriter, r *http.Request) {
	id := h.parseID(r)
	sub, err := h.submissions.FindByID(r.Context(), id, &model.Submission{})
	if err != nil || sub == nil {
		http.NotFound(w, r)
		return
	}
	h.render(w, r, "admin/submission-detail.html", map[string]any{"Submission": sub})
}

// Admin Users

func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.adminUsers.ListAll(r.Context())
	if err != nil {
		slog.Error("listing admin users", "error", err)
	}
	h.render(w, r, "admin/users.html", map[string]any{"Users": users})
}

func (h *Handler) NewUserForm(w http.ResponseWriter, r *http.Request) {
	h.render(w, r, "admin/user-form.html", nil)
}

func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	email := r.FormValue("email")
	name := r.FormValue("name")

	// Check for existing
	existing, _ := h.adminUsers.FindByEmail(r.Context(), email)
	if existing != nil {
		h.render(w, r, "admin/user-form.html", map[string]any{"Error": "Email already exists"})
		return
	}

	tempPassword := generateTempPassword()
	hash, err := bcrypt.GenerateFromPassword([]byte(tempPassword), bcrypt.DefaultCost)
	if err != nil {
		slog.Error("hashing password", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	user := &model.AdminUser{
		Email:              email,
		Name:               name,
		PasswordHash:       string(hash),
		MustChangePassword: true,
		CreatedAt:          time.Now(),
	}
	if _, err := h.adminUsers.Save(r.Context(), user); err != nil {
		slog.Error("creating admin user", "error", err)
		h.render(w, r, "admin/user-form.html", map[string]any{"Error": "Failed to create user"})
		return
	}

	h.render(w, r, "admin/user-form.html", map[string]any{
		"Created":      true,
		"TempPassword": tempPassword,
		"CreatedEmail": email,
		"CreatedName":  name,
	})
}

func (h *Handler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	id := h.parseID(r)
	admin := auth.AdminFromContext(r.Context())
	if admin != nil && admin.AdminID == id {
		h.flash(r, "error", "Cannot delete your own account")
		http.Redirect(w, r, "/admin/users", http.StatusFound)
		return
	}

	// Prevent deleting the last admin
	users, err := h.adminUsers.ListAll(r.Context())
	if err == nil && len(users) <= 1 {
		h.flash(r, "error", "Cannot delete the last admin user")
		http.Redirect(w, r, "/admin/users", http.StatusFound)
		return
	}

	if err := h.adminUsers.Delete(r.Context(), id); err != nil {
		slog.Error("deleting admin user", "error", err)
	}
	h.flash(r, "success", "Admin user deleted")
	http.Redirect(w, r, "/admin/users", http.StatusFound)
}

// Helpers

func (h *Handler) parseID(r *http.Request) int64 {
	idStr := r.PathValue("id")
	id, _ := strconv.ParseInt(idStr, 10, 64)
	return id
}

func (h *Handler) findStore(w http.ResponseWriter, r *http.Request) *model.Store {
	id := h.parseID(r)
	store, err := h.stores.FindByID(r.Context(), id, &model.Store{})
	if err != nil || store == nil {
		http.NotFound(w, r)
		return nil
	}
	return store
}

func (h *Handler) parseStoreForm(r *http.Request) (*model.Store, error) {
	if err := r.ParseForm(); err != nil {
		return nil, fmt.Errorf("invalid form data")
	}
	sortOrder, _ := strconv.Atoi(r.FormValue("sort_order"))
	return &model.Store{
		Town:      r.FormValue("town"),
		Address:   r.FormValue("address"),
		Lat:       r.FormValue("lat"),
		Lng:       r.FormValue("lng"),
		Image:     r.FormValue("image"),
		MapLink:   r.FormValue("map_link"),
		IsActive:  r.FormValue("is_active") == "on",
		SortOrder: sortOrder,
	}, nil
}

func (h *Handler) flash(r *http.Request, key, msg string) {
	sessionID := auth.SessionIDFromContext(r.Context())
	if sessionID != "" {
		h.flashes.Set(sessionID, key, msg)
	}
}


func generateTempPassword() string {
	b := make([]byte, 12)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)[:16]
}
