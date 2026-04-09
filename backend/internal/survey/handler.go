package survey

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"amazing-landing/internal/model"
)

type emailService interface {
	RenderAndSave(ctx context.Context, submissionID int64) (string, error)
}

type Handler struct {
	promotions  *PromotionRepository
	stores      *StoreRepository
	submissions *SubmissionRepository
	products    *ProductRepository
	questions   *QuestionConfigRepository
	emailSvc    emailService
}

func NewHandler(promotions *PromotionRepository, stores *StoreRepository, submissions *SubmissionRepository, products *ProductRepository, questions *QuestionConfigRepository, emailSvc emailService) *Handler {
	return &Handler{
		promotions:  promotions,
		stores:      stores,
		submissions: submissions,
		products:    products,
		questions:   questions,
		emailSvc:    emailSvc,
	}
}

func (h *Handler) GetPromotion(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	promo, err := h.promotions.FindBySlug(r.Context(), slug)
	if err != nil {
		slog.Error("finding promotion", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "internal error"})
		return
	}
	if promo == nil {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "promotion not found"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"promotion": map[string]any{
			"active": promo.Active,
			"name":   promo.Name,
			"slug":   promo.Slug,
		},
	})
}

func (h *Handler) GetStores(w http.ResponseWriter, r *http.Request) {
	stores, err := h.stores.ListActive(r.Context())
	if err != nil {
		slog.Error("listing stores", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "internal error"})
		return
	}

	storeMap := make(map[string]map[string]string)
	for _, s := range stores {
		id := fmt.Sprintf("%d", s.GetID())
		isActive := "0"
		if s.IsActive {
			isActive = "1"
		}
		storeMap[id] = map[string]string{
			"id":        id,
			"town":      s.Town,
			"address":   s.Address,
			"lat":       s.Lat,
			"lng":       s.Lng,
			"image":     s.Image,
			"map_link":  s.MapLink,
			"is_active": isActive,
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{"stores": storeMap})
}

func (h *Handler) SaveCustomer(w http.ResponseWriter, r *http.Request) {
	// Limit request body size to prevent abuse
	r.Body = http.MaxBytesReader(w, r.Body, 64*1024) // 64KB max
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid form data"})
		return
	}

	email := r.FormValue("email")
	if len(email) > 254 || (email != "" && !isValidEmail(email)) {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid email"})
		return
	}
	if len(r.FormValue("firstname")) > 255 || len(r.FormValue("lastname")) > 255 {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "name too long"})
		return
	}

	sub := &model.Submission{
		PromotionSlug: r.FormValue("promotion_link"),
		Firstname:     r.FormValue("firstname"),
		Lastname:      r.FormValue("lastname"),
		Email:         r.FormValue("email"),
		Subscribe:     r.FormValue("subscribe") == "true" || r.FormValue("subscribe") == "1",
		AcceptTerms:   r.FormValue("accept_terms") == "true" || r.FormValue("accept_terms") == "1",
		Age:           r.FormValue("age"),
		Skin:          r.FormValue("skin"),
		Concern1:      r.FormValue("concern_1"),
		Concern2:      r.FormValue("concern_2"),
		Product:       r.FormValue("product"),
		StoreID:       r.FormValue("store_id"),
		Address:       r.FormValue("address"),
		Country:       r.FormValue("country"),
		Lat:           r.FormValue("lat"),
		Lng:           r.FormValue("lng"),
		CreatedAt:     time.Now(),
	}

	saved, err := h.submissions.Save(r.Context(), sub)
	if err != nil {
		slog.Error("saving submission", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "internal error"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"success":       true,
		"submission_id": saved.GetID(),
	})
}

func (h *Handler) UpdateStore(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid form data"})
		return
	}

	submissionIDStr := r.FormValue("submission_id")
	storeID := r.FormValue("store_id")

	submissionID, err := strconv.ParseInt(submissionIDStr, 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid submission_id"})
		return
	}

	sub, err := h.submissions.FindByID(r.Context(), submissionID, &model.Submission{})
	if err != nil {
		slog.Error("finding submission", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "internal error"})
		return
	}
	if sub == nil {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "submission not found"})
		return
	}

	sub.StoreID = storeID
	if _, err := h.submissions.Save(r.Context(), sub); err != nil {
		slog.Error("updating submission store", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "internal error"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"success": true})
}

func (h *Handler) SendEmail(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid form data"})
		return
	}

	submissionIDStr := r.FormValue("submission_id")
	submissionID, err := strconv.ParseInt(submissionIDStr, 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid submission_id"})
		return
	}

	previewURL, err := h.emailSvc.RenderAndSave(r.Context(), submissionID)
	if err != nil {
		slog.Error("rendering email", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "internal error"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"success":           true,
		"email_preview_url": previewURL,
	})
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func isValidEmail(email string) bool {
	// Basic email validation: must have exactly one @ with content on both sides
	at := strings.Index(email, "@")
	if at < 1 {
		return false
	}
	dot := strings.LastIndex(email[at:], ".")
	return dot > 1 && dot < len(email[at:])-1
}
