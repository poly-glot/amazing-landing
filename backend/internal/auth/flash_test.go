package auth

import "testing"

func TestFlashStore_SetAndGet(t *testing.T) {
	fs := NewFlashStore()

	fs.Set("session-1", "success", "Item created")
	got := fs.Get("session-1", "success")
	if got != "Item created" {
		t.Errorf("Get = %q, want %q", got, "Item created")
	}
}

func TestFlashStore_GetConsumesFlash(t *testing.T) {
	fs := NewFlashStore()

	fs.Set("session-1", "success", "Item created")
	fs.Get("session-1", "success")

	// Second get should return empty
	got := fs.Get("session-1", "success")
	if got != "" {
		t.Errorf("expected empty string on second Get, got %q", got)
	}
}

func TestFlashStore_GetNonExistentSession(t *testing.T) {
	fs := NewFlashStore()
	got := fs.Get("nonexistent", "success")
	if got != "" {
		t.Errorf("expected empty string for non-existent session, got %q", got)
	}
}

func TestFlashStore_GetNonExistentKey(t *testing.T) {
	fs := NewFlashStore()
	fs.Set("session-1", "success", "hello")

	got := fs.Get("session-1", "error")
	if got != "" {
		t.Errorf("expected empty string for non-existent key, got %q", got)
	}
}

func TestFlashStore_MultipleKeys(t *testing.T) {
	fs := NewFlashStore()

	fs.Set("session-1", "success", "Created")
	fs.Set("session-1", "error", "Validation failed")

	if got := fs.Get("session-1", "success"); got != "Created" {
		t.Errorf("success = %q, want %q", got, "Created")
	}
	if got := fs.Get("session-1", "error"); got != "Validation failed" {
		t.Errorf("error = %q, want %q", got, "Validation failed")
	}
}

func TestFlashStore_SessionsAreIndependent(t *testing.T) {
	fs := NewFlashStore()

	fs.Set("session-1", "success", "For session 1")
	fs.Set("session-2", "success", "For session 2")

	if got := fs.Get("session-1", "success"); got != "For session 1" {
		t.Errorf("session-1 success = %q, want %q", got, "For session 1")
	}
	if got := fs.Get("session-2", "success"); got != "For session 2" {
		t.Errorf("session-2 success = %q, want %q", got, "For session 2")
	}
}
