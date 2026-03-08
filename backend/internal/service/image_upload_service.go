package service

import (
	"context"
	"io"
	"mime"
	"net/http"
	"path/filepath"
	"strings"

	"civic/internal/errx"
	cld "civic/internal/integrations/cloudinary"
)

type cloudUploader interface {
	IsConfigured() bool
	UploadImage(ctx context.Context, data []byte, filename, mimeType string) (*cld.UploadResult, error)
}

type ImageUploadService struct {
	client   cloudUploader
	maxBytes int64
}

type UploadedAsset struct {
	ID     string `json:"id"`
	URL    string `json:"url"`
	Width  int    `json:"width"`
	Height int    `json:"height"`
	Format string `json:"format"`
}

func NewImageUploadService(client cloudUploader, maxBytes int64) *ImageUploadService {
	if maxBytes <= 0 {
		maxBytes = 10 * 1024 * 1024
	}
	return &ImageUploadService{client: client, maxBytes: maxBytes}
}

func (s *ImageUploadService) MaxBytes() int64 {
	return s.maxBytes
}

func (s *ImageUploadService) Upload(ctx context.Context, file io.Reader, filename, declaredType string) (*UploadedAsset, error) {
	if s.client == nil || !s.client.IsConfigured() {
		return nil, errx.New("CONFIG_MISSING", "upload service is not configured", http.StatusServiceUnavailable)
	}

	data, err := io.ReadAll(io.LimitReader(file, s.maxBytes+1))
	if err != nil {
		return nil, errx.New("INVALID_INPUT", "could not read uploaded file", http.StatusBadRequest)
	}
	if len(data) == 0 {
		return nil, errx.New("INVALID_INPUT", "file is required", http.StatusBadRequest)
	}
	if int64(len(data)) > s.maxBytes {
		return nil, errx.New("PAYLOAD_TOO_LARGE", "file exceeds upload size limit", http.StatusRequestEntityTooLarge)
	}

	detectedType := http.DetectContentType(data)
	if !strings.HasPrefix(detectedType, "image/") {
		return nil, errx.New("UNSUPPORTED_MEDIA_TYPE", "only image files are supported", http.StatusUnsupportedMediaType)
	}

	mimeType := strings.TrimSpace(declaredType)
	if mimeType == "" || !strings.HasPrefix(strings.ToLower(mimeType), "image/") {
		mimeType = detectedType
	}
	filename = strings.TrimSpace(filename)
	if filename == "" {
		ext, _ := mime.ExtensionsByType(mimeType)
		if len(ext) > 0 {
			filename = "upload" + ext[0]
		} else {
			filename = "upload" + filepath.Ext("."+strings.TrimPrefix(mimeType, "image/"))
		}
	}

	result, err := s.client.UploadImage(ctx, data, filename, mimeType)
	if err != nil {
		return nil, errx.New("UPSTREAM_ERROR", "image upload failed", http.StatusBadGateway)
	}

	return &UploadedAsset{
		ID:     result.PublicID,
		URL:    result.SecureURL,
		Width:  result.Width,
		Height: result.Height,
		Format: result.Format,
	}, nil
}
