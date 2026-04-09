package admin

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"sort"
	"strings"
	"time"

	"amazing-landing/internal/model"
)

// QuizConfig is the structured representation of the question configuration.
type QuizConfig struct {
	AgeGroups []string                     `json:"ageGroups"`
	SkinTypes map[string][]string          `json:"skinTypes"`
	Concerns  map[string][]string          `json:"concerns"`
	Mapping   map[string]map[string]string `json:"productMapping"`
	Priority  map[string][]string          `json:"priority"`
}

type AgeGroupData struct {
	Name         string
	SkinTypes    string
	ConcernCount int
	Brands       []string // unique brands mapped
	Priority     []string
}

type ConcernMapping struct {
	Concern string
	Product string
}

func (h *Handler) QuestionsOverview(w http.ResponseWriter, r *http.Request) {
	config := h.loadQuizConfig(r)

	var groups []AgeGroupData
	for _, age := range config.AgeGroups {
		// Collect unique brands
		seen := make(map[string]bool)
		var brands []string
		if m, ok := config.Mapping[age]; ok {
			for _, brand := range m {
				if !seen[brand] {
					seen[brand] = true
					brands = append(brands, brand)
				}
			}
		}
		sort.Strings(brands)

		groups = append(groups, AgeGroupData{
			Name:         age,
			SkinTypes:    strings.Join(config.SkinTypes[age], ", "),
			ConcernCount: len(config.Concerns[age]),
			Brands:       brands,
			Priority:     config.Priority[age],
		})
	}

	// Generate preview JSON
	previewJSON := ""
	if len(config.AgeGroups) > 0 {
		data, _ := json.MarshalIndent(config, "", "  ")
		previewJSON = string(data)
	}

	h.render(w, r, "admin/questions.html", map[string]any{
		"AgeGroups":   groups,
		"HasConfig":   len(config.AgeGroups) > 0,
		"PreviewJSON": previewJSON,
	})
}

func (h *Handler) EditAgeGroup(w http.ResponseWriter, r *http.Request) {
	age := r.PathValue("age")
	config := h.loadQuizConfig(r)

	concerns := config.Concerns[age]
	mapping := config.Mapping[age]
	var cms []ConcernMapping
	for _, c := range concerns {
		cms = append(cms, ConcernMapping{Concern: c, Product: mapping[c]})
	}
	// Pad to at least 1 empty row for adding
	if len(cms) == 0 {
		cms = append(cms, ConcernMapping{})
	}

	brands := h.productBrands(r)

	h.render(w, r, "admin/question-edit.html", map[string]any{
		"AgeName":   age,
		"SkinTypes": strings.Join(config.SkinTypes[age], ", "),
		"Concerns":  cms,
		"Priority":  config.Priority[age],
		"Brands":    brands,
	})
}

func (h *Handler) SaveAgeGroup(w http.ResponseWriter, r *http.Request) {
	age := r.PathValue("age")
	if err := r.ParseForm(); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	config := h.loadQuizConfig(r)

	// Skin types
	var skins []string
	for _, s := range strings.Split(r.FormValue("skin_types"), ",") {
		s = strings.TrimSpace(s)
		if s != "" {
			skins = append(skins, s)
		}
	}
	if config.SkinTypes == nil {
		config.SkinTypes = make(map[string][]string)
	}
	config.SkinTypes[age] = skins

	// Concern → product
	concernTexts := r.Form["concern_text"]
	concernProducts := r.Form["concern_product"]
	var concerns []string
	mapping := make(map[string]string)
	for i, c := range concernTexts {
		c = strings.TrimSpace(c)
		if c == "" {
			continue
		}
		concerns = append(concerns, c)
		if i < len(concernProducts) {
			mapping[c] = concernProducts[i]
		}
	}
	if config.Concerns == nil {
		config.Concerns = make(map[string][]string)
	}
	if config.Mapping == nil {
		config.Mapping = make(map[string]map[string]string)
	}
	config.Concerns[age] = concerns
	config.Mapping[age] = mapping

	// Priority
	priorities := r.Form["priority"]
	var prio []string
	for _, p := range priorities {
		p = strings.TrimSpace(p)
		if p != "" {
			prio = append(prio, p)
		}
	}
	if config.Priority == nil {
		config.Priority = make(map[string][]string)
	}
	config.Priority[age] = prio

	// Ensure in ageGroups list
	found := false
	for _, a := range config.AgeGroups {
		if a == age {
			found = true
			break
		}
	}
	if !found {
		config.AgeGroups = append(config.AgeGroups, age)
	}

	h.saveQuizConfig(r, config)
	h.flash(r, "success", "Age group \""+age+"\" saved")
	http.Redirect(w, r, "/admin/questions", http.StatusFound)
}

func (h *Handler) NewAgeGroupForm(w http.ResponseWriter, r *http.Request) {
	brands := h.productBrands(r)
	h.render(w, r, "admin/question-new.html", map[string]any{"Brands": brands})
}

func (h *Handler) CreateAgeGroup(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	ageName := strings.TrimSpace(r.FormValue("age_name"))
	if ageName == "" {
		h.flash(r, "error", "Age group name is required")
		http.Redirect(w, r, "/admin/questions/new", http.StatusFound)
		return
	}

	config := h.loadQuizConfig(r)
	for _, a := range config.AgeGroups {
		if a == ageName {
			h.flash(r, "error", "Age group already exists")
			http.Redirect(w, r, "/admin/questions/new", http.StatusFound)
			return
		}
	}
	config.AgeGroups = append(config.AgeGroups, ageName)
	if config.SkinTypes == nil { config.SkinTypes = make(map[string][]string) }
	if config.Concerns == nil { config.Concerns = make(map[string][]string) }
	if config.Mapping == nil { config.Mapping = make(map[string]map[string]string) }
	if config.Priority == nil { config.Priority = make(map[string][]string) }
	config.SkinTypes[ageName] = []string{}
	config.Concerns[ageName] = []string{}
	config.Mapping[ageName] = make(map[string]string)
	config.Priority[ageName] = []string{}

	h.saveQuizConfig(r, config)
	h.flash(r, "success", "Age group created — now configure it")
	http.Redirect(w, r, "/admin/questions/"+ageName+"/edit", http.StatusFound)
}

func (h *Handler) DeleteAgeGroup(w http.ResponseWriter, r *http.Request) {
	age := r.PathValue("age")
	config := h.loadQuizConfig(r)
	var newAges []string
	for _, a := range config.AgeGroups {
		if a != age { newAges = append(newAges, a) }
	}
	config.AgeGroups = newAges
	delete(config.SkinTypes, age)
	delete(config.Concerns, age)
	delete(config.Mapping, age)
	delete(config.Priority, age)
	h.saveQuizConfig(r, config)
	h.flash(r, "success", "Age group \""+age+"\" deleted")
	http.Redirect(w, r, "/admin/questions", http.StatusFound)
}

func (h *Handler) ExportQuestionsJSON(w http.ResponseWriter, r *http.Request) {
	config := h.loadQuizConfig(r)
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition", "attachment; filename=questions.json")
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	enc.Encode(config)
}

// ImportQuestionsPage renders the JSON upload form.
func (h *Handler) ImportQuestionsPage(w http.ResponseWriter, r *http.Request) {
	h.render(w, r, "admin/questions-import.html", nil)
}

// ExampleQuestionsJSON returns a downloadable example questions JSON file.
func (h *Handler) ExampleQuestionsJSON(w http.ResponseWriter, r *http.Request) {
	example := &QuizConfig{
		AgeGroups: []string{"Under 25", "25-35"},
		SkinTypes: map[string][]string{
			"Under 25": {"Dry", "Normal", "Oily/Combination"},
			"25-35":    {"Dry", "Normal", "Oily/Combination", "Mature"},
		},
		Concerns: map[string][]string{
			"Under 25": {"Dark spots/Uneven skin tone", "Oil control"},
			"25-35":    {"Fine lines and wrinkles", "Loss of firmness and elasticity"},
		},
		Mapping: map[string]map[string]string{
			"Under 25": {"Dark spots/Uneven skin tone": "Glow", "Oil control": "Glow"},
			"25-35":    {"Fine lines and wrinkles": "Rise", "Loss of firmness and elasticity": "Rise"},
		},
		Priority: map[string][]string{
			"Under 25": {"Glow", "Silk"},
			"25-35":    {"Rise", "Glow"},
		},
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition", "attachment; filename=questions-example.json")
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	enc.Encode(example)
}

func (h *Handler) ImportQuestionsJSON(w http.ResponseWriter, r *http.Request) {
	file, _, err := r.FormFile("file")
	if err != nil {
		h.flash(r, "error", "No file uploaded")
		http.Redirect(w, r, "/admin/questions/import", http.StatusFound)
		return
	}
	defer file.Close()
	var config QuizConfig
	if err := json.NewDecoder(file).Decode(&config); err != nil {
		h.flash(r, "error", "Invalid JSON: "+err.Error())
		http.Redirect(w, r, "/admin/questions/import", http.StatusFound)
		return
	}
	h.saveQuizConfig(r, &config)
	h.flash(r, "success", "Question configuration imported")
	http.Redirect(w, r, "/admin/questions", http.StatusFound)
}

// --- helpers ---

func (h *Handler) loadQuizConfig(r *http.Request) *QuizConfig {
	dbConfig, err := h.questions.GetActive(r.Context())
	if err != nil || dbConfig == nil || dbConfig.ConfigJSON == "" {
		return &QuizConfig{AgeGroups: []string{}, SkinTypes: make(map[string][]string), Concerns: make(map[string][]string), Mapping: make(map[string]map[string]string), Priority: make(map[string][]string)}
	}
	var config QuizConfig
	if err := json.Unmarshal([]byte(dbConfig.ConfigJSON), &config); err != nil {
		slog.Error("parsing question config", "error", err)
		return &QuizConfig{AgeGroups: []string{}, SkinTypes: make(map[string][]string), Concerns: make(map[string][]string), Mapping: make(map[string]map[string]string), Priority: make(map[string][]string)}
	}
	return &config
}

func (h *Handler) saveQuizConfig(r *http.Request, config *QuizConfig) {
	data, _ := json.Marshal(config)
	dbConfig, _ := h.questions.GetActive(r.Context())
	if dbConfig == nil {
		dbConfig = &model.QuestionConfig{Slug: "active"}
	}
	dbConfig.ConfigJSON = string(data)
	dbConfig.UpdatedAt = time.Now()
	if _, err := h.questions.Save(r.Context(), dbConfig); err != nil {
		slog.Error("saving question config", "error", err)
	}
}

func (h *Handler) productBrands(r *http.Request) []string {
	products, err := h.products.ListAllCached(r.Context())
	if err != nil || len(products) == 0 {
		return []string{"Bloom", "Glow", "Rise", "Silk"}
	}
	seen := make(map[string]bool)
	var brands []string
	for _, p := range products {
		if !seen[p.Brand] { seen[p.Brand] = true; brands = append(brands, p.Brand) }
	}
	sort.Strings(brands)
	return brands
}
