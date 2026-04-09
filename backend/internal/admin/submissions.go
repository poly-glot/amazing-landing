package admin

import (
	"encoding/csv"
	"fmt"
	"net/http"
)

const submissionsPageSize = 25

// ListSubmissionsPaginated replaces the old ListSubmissions with cursor-based pagination.
func (h *Handler) ListSubmissionsPaginated(w http.ResponseWriter, r *http.Request) {
	cursor := r.URL.Query().Get("cursor")
	subs, nextCursor, err := h.submissions.ListPaginated(r.Context(), submissionsPageSize, cursor)
	if err != nil {
		h.render(w, r, "admin/submissions.html", map[string]any{
			"Submissions": nil,
			"Error":       "Failed to load submissions",
		})
		return
	}
	h.render(w, r, "admin/submissions.html", map[string]any{
		"Submissions": subs,
		"NextCursor":  nextCursor,
		"HasNext":     nextCursor != "",
		"PageSize":    submissionsPageSize,
	})
}

// ExportSubmissionsCSV streams all submissions as a CSV download.
func (h *Handler) ExportSubmissionsCSV(w http.ResponseWriter, r *http.Request) {
	subs, err := h.submissions.ListAll(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch submissions", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=submissions.csv")

	cw := csv.NewWriter(w)
	_ = cw.Write([]string{
		"id", "firstname", "lastname", "email", "age", "skin",
		"concern_1", "concern_2", "product", "store_id",
		"address", "country", "promotion", "subscribe",
		"accept_terms", "created_at", "email_sent_at",
	})

	for _, s := range subs {
		emailSent := ""
		if s.EmailSentAt != nil {
			emailSent = s.EmailSentAt.Format("2006-01-02 15:04:05")
		}
		subscribe := "false"
		if s.Subscribe {
			subscribe = "true"
		}
		terms := "false"
		if s.AcceptTerms {
			terms = "true"
		}
		_ = cw.Write([]string{
			fmt.Sprintf("%d", s.GetID()),
			s.Firstname, s.Lastname, s.Email,
			s.Age, s.Skin, s.Concern1, s.Concern2,
			s.Product, s.StoreID, s.Address, s.Country,
			s.PromotionSlug, subscribe, terms,
			s.CreatedAt.Format("2006-01-02 15:04:05"),
			emailSent,
		})
	}
	cw.Flush()
}
