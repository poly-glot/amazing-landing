package model

import "time"

type Submission struct {
	Base
	PromotionSlug string     `datastore:"promotionSlug"`
	Firstname     string     `datastore:"firstname"`
	Lastname      string     `datastore:"lastname"`
	Email         string     `datastore:"email"`
	Subscribe     bool       `datastore:"subscribe"`
	AcceptTerms   bool       `datastore:"acceptTerms"`
	Age           string     `datastore:"age"`
	Skin          string     `datastore:"skin"`
	Concern1      string     `datastore:"concern1"`
	Concern2      string     `datastore:"concern2"`
	Product       string     `datastore:"product"`
	StoreID       string     `datastore:"storeId"`
	Address       string     `datastore:"address"`
	Country       string     `datastore:"country"`
	Lat           string     `datastore:"lat"`
	Lng           string     `datastore:"lng"`
	EmailSentAt   *time.Time `datastore:"emailSentAt,omitempty"`
	CreatedAt     time.Time  `datastore:"createdAt"`
}
