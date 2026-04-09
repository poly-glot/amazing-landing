package model

import "time"

type AdminUser struct {
	Base
	Email              string     `datastore:"email"`
	PasswordHash       string     `datastore:"passwordHash"`
	Name               string     `datastore:"name"`
	MustChangePassword bool       `datastore:"mustChangePassword"`
	CreatedAt          time.Time  `datastore:"createdAt"`
	LastLoginAt        *time.Time `datastore:"lastLoginAt,omitempty"`
}
