package email

import (
	"bytes"
	"context"
	"fmt"
	"html/template"
	"strconv"
	"time"

	"amazing-landing/internal/model"
	"amazing-landing/internal/survey"
)

type Service struct {
	repo        *Repository
	submissions *survey.SubmissionRepository
	stores      *survey.StoreRepository
	promotions  *survey.PromotionRepository
	tmpl        *template.Template
}

func NewService(repo *Repository, submissions *survey.SubmissionRepository, stores *survey.StoreRepository, promotions *survey.PromotionRepository) *Service {
	tmpl := template.Must(template.New("email").Parse(emailTemplate))
	return &Service{
		repo:        repo,
		submissions: submissions,
		stores:      stores,
		promotions:  promotions,
		tmpl:        tmpl,
	}
}

func (s *Service) RenderAndSave(ctx context.Context, submissionID int64) (string, error) {
	sub, err := s.submissions.FindByID(ctx, submissionID, &model.Submission{})
	if err != nil {
		return "", fmt.Errorf("finding submission: %w", err)
	}
	if sub == nil {
		return "", fmt.Errorf("submission %d not found", submissionID)
	}

	var storeName, storeAddr string
	if sub.StoreID != "" {
		storeIDInt, parseErr := strconv.ParseInt(sub.StoreID, 10, 64)
		if parseErr == nil {
			store, err := s.stores.FindByID(ctx, storeIDInt, &model.Store{})
			if err == nil && store != nil {
				storeName = store.Town
				storeAddr = store.Address
			}
		}
	}

	var promoName string
	if sub.PromotionSlug != "" {
		promo, err := s.promotions.FindBySlug(ctx, sub.PromotionSlug)
		if err == nil && promo != nil {
			promoName = promo.Name
		}
	}

	data := map[string]string{
		"Firstname":    sub.Firstname,
		"Lastname":     sub.Lastname,
		"Product":      sub.Product,
		"StoreName":    storeName,
		"StoreAddress": storeAddr,
		"PromoName":    promoName,
	}

	var buf bytes.Buffer
	if err := s.tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("rendering email: %w", err)
	}

	now := time.Now()
	sub.EmailSentAt = &now
	if _, err := s.submissions.Save(ctx, sub); err != nil {
		return "", fmt.Errorf("updating submission: %w", err)
	}

	record := &model.EmailRecord{
		SubmissionID: submissionID,
		Recipient:    sub.Email,
		Subject:      fmt.Sprintf("Your %s Voucher", promoName),
		HTMLBody:     buf.String(),
		CreatedAt:    now,
	}
	saved, err := s.repo.Save(ctx, record)
	if err != nil {
		return "", fmt.Errorf("saving email record: %w", err)
	}

	return fmt.Sprintf("/api/v1/survey/email/preview/%d", saved.GetID()), nil
}

func (s *Service) GetPreviewHTML(ctx context.Context, emailRecordID int64) (string, error) {
	record, err := s.repo.FindByID(ctx, emailRecordID, &model.EmailRecord{})
	if err != nil {
		return "", fmt.Errorf("finding email record: %w", err)
	}
	if record == nil {
		return "", fmt.Errorf("email record %d not found", emailRecordID)
	}
	return record.HTMLBody, nil
}

const emailTemplate = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Voucher</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; margin: 0; padding: 0; background: #f5f0eb; }
  .container { max-width: 600px; margin: 0 auto; background: #fff; }
  .header { background: #002b5c; padding: 30px; text-align: center; }
  .header h1 { color: #c8a96e; font-size: 24px; margin: 0; letter-spacing: 2px; }
  .content { padding: 40px 30px; }
  .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
  .product-name { font-size: 22px; color: #002b5c; font-weight: bold; margin: 20px 0; }
  .store-info { background: #f5f0eb; padding: 20px; border-radius: 4px; margin: 20px 0; }
  .store-info h3 { color: #002b5c; margin-top: 0; }
  .voucher-box { border: 2px dashed #c8a96e; padding: 20px; text-align: center; margin: 30px 0; }
  .voucher-box h2 { color: #002b5c; margin: 0; }
  .footer { background: #002b5c; color: #fff; padding: 20px; text-align: center; font-size: 12px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>AZADI</h1>
  </div>
  <div class="content">
    <p class="greeting">Dear {{.Firstname}},</p>
    <p>Thank you for completing our skincare consultation. Based on your answers, we've selected the perfect product for you.</p>
    <p class="product-name">{{.Product}} — Your Personalised Skincare Match</p>
    <div class="voucher-box">
      <h2>{{.PromoName}}</h2>
      <p>Present this email at your selected store to redeem your complimentary trial.</p>
    </div>
    {{if .StoreName}}
    <div class="store-info">
      <h3>Your Selected Store</h3>
      <p><strong>{{.StoreName}}</strong></p>
      <p>{{.StoreAddress}}</p>
    </div>
    {{end}}
    <p>We look forward to welcoming you.</p>
    <p><em>The Azadi Team</em></p>
  </div>
  <div class="footer">
    <p>&copy; Azadi Cosmetics</p>
  </div>
</div>
</body>
</html>`
