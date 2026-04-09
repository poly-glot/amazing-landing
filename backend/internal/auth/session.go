package auth

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"sync"
	"time"
)

type SessionData struct {
	AdminID            int64  `json:"aid"`
	AdminName          string `json:"an"`
	Email              string `json:"em"`
	MustChangePassword bool   `json:"mcp"`
	CreatedAt          int64  `json:"ca"`
}

type SessionStore struct {
	mu       sync.RWMutex
	sessions map[string]*SessionData
	gcm      cipher.AEAD
	secure   bool
	ttl      time.Duration
}

func NewSessionStore(ctx context.Context, encryptionKey string, secure bool) (*SessionStore, error) {
	keyBytes := []byte(encryptionKey)
	if len(keyBytes) < 32 {
		return nil, errors.New("encryption key must be at least 32 bytes")
	}
	keyBytes = keyBytes[:32]

	block, err := aes.NewCipher(keyBytes)
	if err != nil {
		return nil, fmt.Errorf("creating cipher: %w", err)
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("creating GCM: %w", err)
	}

	ss := &SessionStore{
		sessions: make(map[string]*SessionData),
		gcm:      gcm,
		secure:   secure,
		ttl:      2 * time.Hour,
	}
	go ss.cleanupLoop(ctx)
	return ss, nil
}

func (s *SessionStore) Create(w http.ResponseWriter, data *SessionData) error {
	idBytes := make([]byte, 32)
	if _, err := rand.Read(idBytes); err != nil {
		return fmt.Errorf("generating session ID: %w", err)
	}
	sessionID := base64.RawURLEncoding.EncodeToString(idBytes)
	data.CreatedAt = time.Now().Unix()

	s.mu.Lock()
	for id, existing := range s.sessions {
		if existing.AdminID == data.AdminID {
			delete(s.sessions, id)
		}
	}
	s.sessions[sessionID] = data
	s.mu.Unlock()

	encrypted, err := s.encrypt(sessionID)
	if err != nil {
		return fmt.Errorf("encrypting session: %w", err)
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "__session",
		Value:    encrypted,
		Path:     "/",
		HttpOnly: true,
		Secure:   s.secure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(s.ttl.Seconds()),
	})
	return nil
}

func (s *SessionStore) Get(r *http.Request) (*SessionData, string) {
	cookie, err := r.Cookie("__session")
	if err != nil {
		return nil, ""
	}
	sessionID, err := s.decrypt(cookie.Value)
	if err != nil {
		return nil, ""
	}

	s.mu.RLock()
	data, ok := s.sessions[sessionID]
	s.mu.RUnlock()

	if !ok {
		return nil, ""
	}
	if time.Since(time.Unix(data.CreatedAt, 0)) > s.ttl {
		s.mu.Lock()
		delete(s.sessions, sessionID)
		s.mu.Unlock()
		return nil, ""
	}
	return data, sessionID
}

func (s *SessionStore) Destroy(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("__session")
	if err != nil {
		return
	}
	sessionID, err := s.decrypt(cookie.Value)
	if err == nil {
		s.mu.Lock()
		delete(s.sessions, sessionID)
		s.mu.Unlock()
	}
	http.SetCookie(w, &http.Cookie{
		Name:     "__session",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   s.secure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
}

func (s *SessionStore) encrypt(plaintext string) (string, error) {
	nonce := make([]byte, s.gcm.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}
	ciphertext := s.gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.RawURLEncoding.EncodeToString(ciphertext), nil
}

func (s *SessionStore) decrypt(encoded string) (string, error) {
	data, err := base64.RawURLEncoding.DecodeString(encoded)
	if err != nil {
		return "", err
	}
	nonceSize := s.gcm.NonceSize()
	if len(data) < nonceSize {
		return "", errors.New("ciphertext too short")
	}
	plaintext, err := s.gcm.Open(nil, data[:nonceSize], data[nonceSize:], nil)
	if err != nil {
		return "", err
	}
	return string(plaintext), nil
}

func (s *SessionStore) cleanupLoop(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.mu.Lock()
			now := time.Now()
			for id, data := range s.sessions {
				if now.Sub(time.Unix(data.CreatedAt, 0)) > s.ttl {
					delete(s.sessions, id)
				}
			}
			s.mu.Unlock()
		}
	}
}

// FlashStore provides one-time messages between requests.
type FlashStore struct {
	mu      sync.Mutex
	flashes map[string]map[string]string
}

func NewFlashStore() *FlashStore {
	return &FlashStore{flashes: make(map[string]map[string]string)}
}

func (f *FlashStore) Set(sessionID, key, value string) {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.flashes[sessionID] == nil {
		f.flashes[sessionID] = make(map[string]string)
	}
	f.flashes[sessionID][key] = value
}

func (f *FlashStore) Get(sessionID, key string) string {
	f.mu.Lock()
	defer f.mu.Unlock()
	if m, ok := f.flashes[sessionID]; ok {
		v := m[key]
		delete(m, key)
		if len(m) == 0 {
			delete(f.flashes, sessionID)
		}
		return v
	}
	return ""
}
