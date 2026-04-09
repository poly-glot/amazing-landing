package auth

import (
	"context"
	"errors"
	"fmt"
	"time"

	"amazing-landing/internal/model"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrBadCredentials = errors.New("invalid email or password")
	ErrAccountLocked  = errors.New("account temporarily locked due to too many failed attempts")
)

type adminFinder interface {
	FindByEmail(ctx context.Context, email string) (*model.AdminUser, error)
	Save(ctx context.Context, user *model.AdminUser) (*model.AdminUser, error)
}

type Provider struct {
	repo    adminFinder
	tracker *LoginAttemptTracker
}

func NewProvider(repo adminFinder, tracker *LoginAttemptTracker) *Provider {
	return &Provider{repo: repo, tracker: tracker}
}

func (p *Provider) Authenticate(ctx context.Context, email, password string) (*SessionData, bool, error) {
	if len(password) > 128 {
		return nil, false, ErrBadCredentials
	}
	if p.tracker.IsBlocked(email) {
		return nil, false, ErrAccountLocked
	}

	user, err := p.repo.FindByEmail(ctx, email)
	if err != nil {
		return nil, false, fmt.Errorf("looking up admin: %w", err)
	}
	if user == nil {
		p.tracker.RecordFailure(email)
		return nil, false, ErrBadCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		p.tracker.RecordFailure(email)
		return nil, false, ErrBadCredentials
	}

	p.tracker.RecordSuccess(email)

	now := time.Now()
	user.LastLoginAt = &now
	_, _ = p.repo.Save(ctx, user)

	return &SessionData{
		AdminID:            user.GetID(),
		AdminName:          user.Name,
		Email:              user.Email,
		MustChangePassword: user.MustChangePassword,
	}, user.MustChangePassword, nil
}
