package model

import "time"

type EmailRecord struct {
	Base
	SubmissionID int64     `datastore:"submissionId"`
	Recipient    string    `datastore:"recipient"`
	Subject      string    `datastore:"subject"`
	HTMLBody     string    `datastore:"htmlBody,noindex"`
	CreatedAt    time.Time `datastore:"createdAt"`
}
