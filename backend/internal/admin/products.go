package admin

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"amazing-landing/internal/model"
)

// Products CRUD

func (h *Handler) ListProducts(w http.ResponseWriter, r *http.Request) {
	products, err := h.products.ListAll(r.Context())
	if err != nil {
		slog.Error("listing products", "error", err)
	}
	h.render(w, r, "admin/products.html", map[string]any{"Products": products})
}

func (h *Handler) NewProductForm(w http.ResponseWriter, r *http.Request) {
	h.render(w, r, "admin/product-form.html", map[string]any{"Product": &model.Product{}})
}

func (h *Handler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	product, err := parseProductForm(r)
	if err != nil {
		h.render(w, r, "admin/product-form.html", map[string]any{"Product": product, "Error": err.Error()})
		return
	}
	now := time.Now()
	product.CreatedAt = now
	product.UpdatedAt = now
	if _, err := h.products.Save(r.Context(), product); err != nil {
		slog.Error("creating product", "error", err)
		h.render(w, r, "admin/product-form.html", map[string]any{"Product": product, "Error": "Failed to create product"})
		return
	}
	h.products.InvalidateCache()
	h.flash(r, "success", "Product created successfully")
	http.Redirect(w, r, "/admin/products", http.StatusFound)
}

func (h *Handler) EditProductForm(w http.ResponseWriter, r *http.Request) {
	id := h.parseID(r)
	product, err := h.products.FindByID(r.Context(), id, &model.Product{})
	if err != nil || product == nil {
		http.NotFound(w, r)
		return
	}
	h.render(w, r, "admin/product-form.html", map[string]any{"Product": product})
}

func (h *Handler) UpdateProduct(w http.ResponseWriter, r *http.Request) {
	id := h.parseID(r)
	existing, err := h.products.FindByID(r.Context(), id, &model.Product{})
	if err != nil || existing == nil {
		http.NotFound(w, r)
		return
	}
	product, err := parseProductForm(r)
	if err != nil {
		h.render(w, r, "admin/product-form.html", map[string]any{"Product": product, "Error": err.Error()})
		return
	}
	product.SetID(existing.GetID())
	product.CreatedAt = existing.CreatedAt
	product.UpdatedAt = time.Now()
	if _, err := h.products.Save(r.Context(), product); err != nil {
		slog.Error("updating product", "error", err)
		h.render(w, r, "admin/product-form.html", map[string]any{"Product": product, "Error": "Failed to update"})
		return
	}
	h.products.InvalidateCache()
	h.flash(r, "success", "Product updated successfully")
	http.Redirect(w, r, "/admin/products", http.StatusFound)
}

func (h *Handler) DeleteProduct(w http.ResponseWriter, r *http.Request) {
	id := h.parseID(r)
	if err := h.products.Delete(r.Context(), id); err != nil {
		slog.Error("deleting product", "error", err)
	}
	h.products.InvalidateCache()
	h.flash(r, "success", "Product deleted")
	http.Redirect(w, r, "/admin/products", http.StatusFound)
}

// Export products as CSV
func (h *Handler) ExportProducts(w http.ResponseWriter, r *http.Request) {
	products, err := h.products.ListAll(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch products", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=products.csv")

	cw := csv.NewWriter(w)
	_ = cw.Write([]string{"brand", "name", "type", "image", "price", "url", "sort_order"})
	for _, p := range products {
		_ = cw.Write([]string{p.Brand, p.Name, p.Type, p.Image, p.Price, p.URL, strconv.Itoa(p.SortOrder)})
	}
	cw.Flush()
}

// Import products from CSV
func (h *Handler) ImportProducts(w http.ResponseWriter, r *http.Request) {
	file, _, err := r.FormFile("file")
	if err != nil {
		h.flash(r, "error", "No file uploaded")
		http.Redirect(w, r, "/admin/products/import", http.StatusFound)
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	header, err := reader.Read()
	if err != nil {
		h.flash(r, "error", "Invalid CSV file")
		http.Redirect(w, r, "/admin/products/import", http.StatusFound)
		return
	}

	// Build column index
	idx := make(map[string]int)
	for i, col := range header {
		idx[col] = i
	}

	required := []string{"brand", "name", "type", "image", "price", "url"}
	for _, col := range required {
		if _, ok := idx[col]; !ok {
			h.flash(r, "error", fmt.Sprintf("Missing required column: %s", col))
			http.Redirect(w, r, "/admin/products/import", http.StatusFound)
			return
		}
	}

	now := time.Now()
	var count int
	for {
		row, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			continue
		}
		sortOrder := 0
		if i, ok := idx["sort_order"]; ok && i < len(row) {
			sortOrder, _ = strconv.Atoi(row[i])
		}
		product := &model.Product{
			Brand:     row[idx["brand"]],
			Name:      row[idx["name"]],
			Type:      row[idx["type"]],
			Image:     row[idx["image"]],
			Price:     row[idx["price"]],
			URL:       row[idx["url"]],
			SortOrder: sortOrder,
			CreatedAt: now,
			UpdatedAt: now,
		}
		if _, err := h.products.Save(r.Context(), product); err != nil {
			slog.Error("importing product", "error", err)
			continue
		}
		count++
	}

	h.products.InvalidateCache()
	h.flash(r, "success", fmt.Sprintf("Imported %d products", count))
	http.Redirect(w, r, "/admin/products", http.StatusFound)
}

// ImportProductsPage renders the CSV upload form.
func (h *Handler) ImportProductsPage(w http.ResponseWriter, r *http.Request) {
	h.render(w, r, "admin/product-import.html", nil)
}

// ExampleProductsCSV returns a downloadable example CSV file.
func (h *Handler) ExampleProductsCSV(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=products-example.csv")

	cw := csv.NewWriter(w)
	_ = cw.Write([]string{"brand", "name", "type", "image", "price", "url", "sort_order"})
	_ = cw.Write([]string{"Bloom", "Bloom Lotion", "Tone", "bloom_lotion.jpg", "£42", "https://azadi-cosmetics.com/bloom-lotion", "1"})
	_ = cw.Write([]string{"Silk", "Silk Cleansing Oil", "Cleanse", "silk_cleansing_oil.jpg", "£17", "https://azadi-cosmetics.com/silk-cleansing-oil", "2"})
	cw.Flush()
}

// Export products as JSON
func (h *Handler) ExportProductsJSON(w http.ResponseWriter, r *http.Request) {
	products, err := h.products.ListAll(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch products", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition", "attachment; filename=products.json")
	_ = json.NewEncoder(w).Encode(products)
}

func parseProductForm(r *http.Request) (*model.Product, error) {
	if err := r.ParseForm(); err != nil {
		return nil, fmt.Errorf("invalid form data")
	}
	sortOrder, _ := strconv.Atoi(r.FormValue("sort_order"))
	return &model.Product{
		Brand:     r.FormValue("brand"),
		Name:      r.FormValue("name"),
		Type:      r.FormValue("type"),
		Image:     r.FormValue("image"),
		Price:     r.FormValue("price"),
		URL:       r.FormValue("url"),
		SortOrder: sortOrder,
	}, nil
}
