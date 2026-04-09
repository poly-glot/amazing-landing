package survey

import (
	"net/http"
)

// GetProducts returns all products grouped by brand, with 15-minute cache.
func (h *Handler) GetProducts(w http.ResponseWriter, r *http.Request) {
	products, err := h.products.ListAllCached(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "internal error"})
		return
	}

	// Group by brand
	grouped := make(map[string][]map[string]any)
	for _, p := range products {
		grouped[p.Brand] = append(grouped[p.Brand], map[string]any{
			"name":  p.Name,
			"type":  p.Type,
			"image": p.Image,
			"price": p.Price,
			"url":   p.URL,
		})
	}

	w.Header().Set("Cache-Control", "public, max-age=900") // 15 minutes
	writeJSON(w, http.StatusOK, map[string]any{"products": grouped})
}

// GetQuestions returns the active question configuration JSON.
func (h *Handler) GetQuestions(w http.ResponseWriter, r *http.Request) {
	config, err := h.questions.GetActive(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "internal error"})
		return
	}
	if config == nil {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "no question config found"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "public, max-age=900")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(config.ConfigJSON))
}
