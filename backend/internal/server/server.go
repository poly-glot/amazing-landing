package server

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"amazing-landing/internal/admin"
	"amazing-landing/internal/auth"
	"amazing-landing/internal/config"
	"amazing-landing/internal/email"
	"amazing-landing/internal/middleware"
	"amazing-landing/internal/survey"
)

type Server struct {
	cfg           *config.Config
	sessions      *auth.SessionStore
	flashes       *auth.FlashStore
	templates     map[string]*template.Template
	viteAssets    map[string]string
	authHandler   *auth.Handler
	surveyHandler *survey.Handler
	adminHandler  *admin.Handler
	emailHandler  *email.Handler
	rateLimiter   *auth.RateLimiter
}

type Deps struct {
	Cfg         *config.Config
	Sessions    *auth.SessionStore
	Flashes     *auth.FlashStore
	RateLimiter *auth.RateLimiter
}

func New(deps Deps) (*Server, error) {
	s := &Server{
		cfg:         deps.Cfg,
		sessions:    deps.Sessions,
		flashes:     deps.Flashes,
		rateLimiter: deps.RateLimiter,
	}
	if err := s.loadTemplates(); err != nil {
		return nil, fmt.Errorf("loading templates: %w", err)
	}
	s.loadViteManifest()
	return s, nil
}

func (s *Server) SetHandlers(authH *auth.Handler, surveyH *survey.Handler, adminH *admin.Handler, emailH *email.Handler) {
	s.authHandler = authH
	s.surveyHandler = surveyH
	s.adminHandler = adminH
	s.emailHandler = emailH
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()

	// Public routes
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		http.Redirect(w, r, "/2026/desktop/", http.StatusFound)
	})
	mux.HandleFunc("GET /login", s.authHandler.LoginPage)
	mux.HandleFunc("POST /login", s.authHandler.Login)
	mux.HandleFunc("POST /logout", s.authHandler.Logout)
	mux.HandleFunc("GET /health", healthCheck)

	// Auth (requires login)
	requireAdmin := func(h http.HandlerFunc) http.Handler {
		return auth.RequireAdmin(s.sessions, h)
	}
	mux.Handle("GET /change-password", requireAdmin(s.authHandler.ChangePasswordPage))
	mux.Handle("POST /change-password", requireAdmin(s.authHandler.ChangePassword))

	// Survey API (public JSON)
	mux.HandleFunc("GET /api/v1/survey/promotion/{slug}", s.surveyHandler.GetPromotion)
	mux.HandleFunc("GET /api/v1/survey/stores", s.surveyHandler.GetStores)
	mux.HandleFunc("POST /api/v1/survey/customer", s.surveyHandler.SaveCustomer)
	mux.HandleFunc("POST /api/v1/survey/updatestore", s.surveyHandler.UpdateStore)
	mux.HandleFunc("POST /api/v1/survey/email", s.surveyHandler.SendEmail)
	mux.HandleFunc("GET /api/v1/survey/email/preview/{id}", s.emailHandler.PreviewEmail)
	mux.HandleFunc("GET /api/v1/survey/products", s.surveyHandler.GetProducts)
	mux.HandleFunc("GET /api/v1/survey/questions", s.surveyHandler.GetQuestions)

	// Admin routes
	mux.Handle("GET /admin", requireAdmin(s.adminHandler.Dashboard))
	mux.Handle("GET /admin/stores", requireAdmin(s.adminHandler.ListStores))
	mux.Handle("GET /admin/stores/new", requireAdmin(s.adminHandler.NewStoreForm))
	mux.Handle("POST /admin/stores", requireAdmin(s.adminHandler.CreateStore))
	mux.Handle("GET /admin/stores/{id}/edit", requireAdmin(s.adminHandler.EditStoreForm))
	mux.Handle("POST /admin/stores/{id}", requireAdmin(s.adminHandler.UpdateStore))
	mux.Handle("POST /admin/stores/{id}/delete", requireAdmin(s.adminHandler.DeleteStore))
	mux.Handle("POST /admin/stores/{id}/toggle", requireAdmin(s.adminHandler.ToggleStore))
	mux.Handle("GET /admin/promotions", requireAdmin(s.adminHandler.ListPromotions))
	mux.Handle("GET /admin/promotions/new", requireAdmin(s.adminHandler.NewPromotionForm))
	mux.Handle("POST /admin/promotions", requireAdmin(s.adminHandler.CreatePromotion))
	mux.Handle("GET /admin/promotions/{id}/edit", requireAdmin(s.adminHandler.EditPromotionForm))
	mux.Handle("POST /admin/promotions/{id}", requireAdmin(s.adminHandler.UpdatePromotion))
	mux.Handle("POST /admin/promotions/{id}/delete", requireAdmin(s.adminHandler.DeletePromotion))
	mux.Handle("POST /admin/promotions/{id}/toggle", requireAdmin(s.adminHandler.TogglePromotion))
	mux.Handle("GET /admin/submissions", requireAdmin(s.adminHandler.ListSubmissionsPaginated))
	mux.Handle("GET /admin/submissions/export", requireAdmin(s.adminHandler.ExportSubmissionsCSV))
	mux.Handle("GET /admin/submissions/{id}", requireAdmin(s.adminHandler.SubmissionDetail))
	mux.Handle("GET /admin/products", requireAdmin(s.adminHandler.ListProducts))
	mux.Handle("GET /admin/products/new", requireAdmin(s.adminHandler.NewProductForm))
	mux.Handle("POST /admin/products", requireAdmin(s.adminHandler.CreateProduct))
	mux.Handle("GET /admin/products/{id}/edit", requireAdmin(s.adminHandler.EditProductForm))
	mux.Handle("POST /admin/products/{id}", requireAdmin(s.adminHandler.UpdateProduct))
	mux.Handle("POST /admin/products/{id}/delete", requireAdmin(s.adminHandler.DeleteProduct))
	mux.Handle("GET /admin/products/export", requireAdmin(s.adminHandler.ExportProducts))
	mux.Handle("GET /admin/products/export.json", requireAdmin(s.adminHandler.ExportProductsJSON))
	mux.Handle("GET /admin/products/import", requireAdmin(s.adminHandler.ImportProductsPage))
	mux.Handle("GET /admin/products/example.csv", requireAdmin(s.adminHandler.ExampleProductsCSV))
	mux.Handle("POST /admin/products/import", requireAdmin(s.adminHandler.ImportProducts))
	mux.Handle("GET /admin/questions", requireAdmin(s.adminHandler.QuestionsOverview))
	mux.Handle("GET /admin/questions/new", requireAdmin(s.adminHandler.NewAgeGroupForm))
	mux.Handle("POST /admin/questions/new", requireAdmin(s.adminHandler.CreateAgeGroup))
	mux.Handle("GET /admin/questions/export", requireAdmin(s.adminHandler.ExportQuestionsJSON))
	mux.Handle("GET /admin/questions/import", requireAdmin(s.adminHandler.ImportQuestionsPage))
	mux.Handle("GET /admin/questions/example.json", requireAdmin(s.adminHandler.ExampleQuestionsJSON))
	mux.Handle("POST /admin/questions/import", requireAdmin(s.adminHandler.ImportQuestionsJSON))
	mux.Handle("GET /admin/questions/{age}/edit", requireAdmin(s.adminHandler.EditAgeGroup))
	mux.Handle("POST /admin/questions/{age}", requireAdmin(s.adminHandler.SaveAgeGroup))
	mux.Handle("POST /admin/questions/{age}/delete", requireAdmin(s.adminHandler.DeleteAgeGroup))
	mux.Handle("GET /admin/users", requireAdmin(s.adminHandler.ListUsers))
	mux.Handle("GET /admin/users/new", requireAdmin(s.adminHandler.NewUserForm))
	mux.Handle("POST /admin/users", requireAdmin(s.adminHandler.CreateUser))
	mux.Handle("POST /admin/users/{id}/delete", requireAdmin(s.adminHandler.DeleteUser))

	// Static assets — try quiz dist, then shared assets, then admin dist.
	mux.Handle("GET /assets/", http.StripPrefix("/assets/", fallbackFileServer(
		http.Dir(s.cfg.FrontendDir+"/dist/assets"),
		http.Dir(s.cfg.FrontendDir+"/assets"),
		http.Dir(s.cfg.AdminAssetsDir),
	)))

	// Dev mode: serve quiz pages.
	// 2026 uses ES modules — must serve from dist/ (Vite-built).
	// 2015 uses traditional <script> tags — serve from source (JS files aren't bundled by Vite).
	if s.cfg.IsDev() && s.cfg.FrontendDir != "" {
		mux.Handle("GET /2026/", http.StripPrefix("/2026/", http.FileServer(http.Dir(s.cfg.FrontendDir+"/dist/2026"))))
		mux.Handle("GET /2015/", http.StripPrefix("/2015/", http.FileServer(http.Dir(s.cfg.FrontendDir+"/2015"))))
	}

	// Middleware chain
	var handler http.Handler = mux
	handler = middleware.CSRF(handler)
	handler = middleware.CSP(s.cfg.ViteDevURL)(handler)
	handler = middleware.SecurityHeaders(handler)
	handler = s.rateLimiter.Middleware(handler)
	handler = middleware.Logging(handler)

	return handler
}

func (s *Server) render(w http.ResponseWriter, r *http.Request, name string, data map[string]any) {
	if data == nil {
		data = make(map[string]any)
	}

	if admin := auth.AdminFromContext(r.Context()); admin != nil {
		data["Admin"] = admin
	}
	data["CSPNonce"] = middleware.NonceFromContext(r.Context())
	data["CSRFToken"] = middleware.CSRFTokenFromRequest(r)
	data["RequestURI"] = r.URL.Path
	data["ViteDevURL"] = s.cfg.ViteDevURL
	data["ViteAssets"] = s.viteAssets
	data["DemoMode"] = s.cfg.DemoMode

	if sessionID := auth.SessionIDFromContext(r.Context()); sessionID != "" {
		if msg := s.flashes.Get(sessionID, "success"); msg != "" {
			data["Success"] = msg
		}
		if msg := s.flashes.Get(sessionID, "error"); msg != "" {
			data["Error"] = msg
		}
	}

	tmpl, ok := s.templates[name]
	if !ok {
		slog.Error("template not found", "template", name)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	var buf bytes.Buffer
	if err := tmpl.ExecuteTemplate(&buf, name, data); err != nil {
		slog.Error("template render failed", "template", name, "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	_, _ = buf.WriteTo(w)
}

func (s *Server) RenderFunc() auth.RenderFunc {
	return s.render
}

func (s *Server) loadTemplates() error {
	funcMap := template.FuncMap{
		"nonce":     func() string { return "" },
		"hasPrefix": strings.HasPrefix,
		"formatDate": func(t interface{}) string {
			return fmt.Sprintf("%v", t)
		},
	}

	base := template.New("").Funcs(funcMap)
	for _, pattern := range []string{"templates/layout.html", "templates/fragments/*.html"} {
		matches, _ := filepath.Glob(pattern)
		for _, match := range matches {
			content, err := os.ReadFile(match)
			if err != nil {
				return fmt.Errorf("reading template %s: %w", match, err)
			}
			if _, err := base.New(match).Parse(string(content)); err != nil {
				return fmt.Errorf("parsing template %s: %w", match, err)
			}
		}
	}

	s.templates = make(map[string]*template.Template)
	for _, dir := range []string{"", "admin"} {
		pattern := filepath.Join("templates", dir, "*.html")
		matches, _ := filepath.Glob(pattern)
		for _, match := range matches {
			rel, _ := filepath.Rel("templates", match)
			if rel == "layout.html" || filepath.Dir(rel) == "fragments" {
				continue
			}
			content, err := os.ReadFile(match)
			if err != nil {
				return fmt.Errorf("reading template %s: %w", match, err)
			}
			pageSet, err := base.Clone()
			if err != nil {
				return fmt.Errorf("cloning base for %s: %w", rel, err)
			}
			if _, err := pageSet.New(rel).Parse(string(content)); err != nil {
				return fmt.Errorf("parsing template %s: %w", rel, err)
			}
			s.templates[rel] = pageSet
		}
	}
	return nil
}

func (s *Server) loadViteManifest() {
	s.viteAssets = make(map[string]string)
	data, err := os.ReadFile("frontend/dist/.vite/manifest.json")
	if err != nil {
		slog.Info("vite manifest not found (expected in dev)")
		return
	}

	var manifest map[string]struct {
		File string   `json:"file"`
		CSS  []string `json:"css"`
	}
	if err := json.Unmarshal(data, &manifest); err != nil {
		slog.Warn("failed to parse vite manifest", "error", err)
		return
	}

	for key, entry := range manifest {
		s.viteAssets[key] = "/assets/" + entry.File
		for _, css := range entry.CSS {
			s.viteAssets[key+".css"] = "/assets/" + css
		}
	}
	slog.Info("loaded vite manifest", "entries", len(manifest))
}

// fallbackFileServer tries each directory in order, serving from the first that has the file.
func fallbackFileServer(dirs ...http.Dir) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		for _, dir := range dirs {
			if f, err := dir.Open(r.URL.Path); err == nil {
				f.Close()
				http.FileServer(dir).ServeHTTP(w, r)
				return
			}
		}
		http.NotFound(w, r)
	})
}

func healthCheck(w http.ResponseWriter, _ *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("ok"))
}
