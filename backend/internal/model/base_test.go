package model

import "testing"

func TestBase_GetSetID(t *testing.T) {
	b := &Base{}
	if b.GetID() != 0 {
		t.Errorf("new Base ID = %d, want 0", b.GetID())
	}

	b.SetID(42)
	if b.GetID() != 42 {
		t.Errorf("after SetID(42), GetID() = %d, want 42", b.GetID())
	}
}

func TestPromotion_EmbedBase(t *testing.T) {
	p := &Promotion{Name: "Test", Slug: "test", Active: true}
	p.SetID(1)
	if p.GetID() != 1 {
		t.Errorf("Promotion.GetID() = %d, want 1", p.GetID())
	}
}

func TestStore_EmbedBase(t *testing.T) {
	s := &Store{Town: "London", IsActive: true}
	s.SetID(5)
	if s.GetID() != 5 {
		t.Errorf("Store.GetID() = %d, want 5", s.GetID())
	}
}

func TestSubmission_EmbedBase(t *testing.T) {
	s := &Submission{Firstname: "Jane", Email: "jane@test.com"}
	s.SetID(100)
	if s.GetID() != 100 {
		t.Errorf("Submission.GetID() = %d, want 100", s.GetID())
	}
}

func TestAdminUser_EmbedBase(t *testing.T) {
	a := &AdminUser{Email: "admin@test.com", MustChangePassword: true}
	a.SetID(7)
	if a.GetID() != 7 {
		t.Errorf("AdminUser.GetID() = %d, want 7", a.GetID())
	}
}
