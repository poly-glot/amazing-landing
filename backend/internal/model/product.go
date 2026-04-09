package model

import "time"

// Product represents a carousel recommendation item within a brand.
type Product struct {
	Base
	Brand     string    `datastore:"brand"`     // Bloom, Glow, Rise, Silk
	Name      string    `datastore:"name"`      // e.g. "Bloom Lotion"
	Type      string    `datastore:"type"`      // e.g. "Tone", "Treat", "Moisturise"
	Image     string    `datastore:"image"`     // filename: "bloom_lotion.jpg"
	Price     string    `datastore:"price"`     // display price: "£42"
	URL       string    `datastore:"url"`       // product page URL
	SortOrder int       `datastore:"sortOrder"`
	CreatedAt time.Time `datastore:"createdAt"`
	UpdatedAt time.Time `datastore:"updatedAt"`
}
