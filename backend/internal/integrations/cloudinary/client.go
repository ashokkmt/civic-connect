package cloudinary

import (
	"bytes"
	"context"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"net/url"
	"sort"
	"strings"
	"time"
)

type Config struct {
	CloudName string
	APIKey    string
	APISecret string
	Folder    string
}

type Client struct {
	cfg        Config
	httpClient *http.Client
}

type UploadResult struct {
	PublicID  string
	SecureURL string
	Width     int
	Height    int
	Format    string
}

func NewClient(cfg Config) *Client {
	return &Client{
		cfg:        cfg,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *Client) IsConfigured() bool {
	return strings.TrimSpace(c.cfg.CloudName) != "" && strings.TrimSpace(c.cfg.APIKey) != "" && strings.TrimSpace(c.cfg.APISecret) != ""
}

func (c *Client) UploadImage(ctx context.Context, data []byte, filename, mimeType string) (*UploadResult, error) {
	if !c.IsConfigured() {
		return nil, fmt.Errorf("cloudinary is not configured")
	}

	timestamp := fmt.Sprintf("%d", time.Now().Unix())
	params := map[string]string{"timestamp": timestamp}
	if strings.TrimSpace(c.cfg.Folder) != "" {
		params["folder"] = strings.TrimSpace(c.cfg.Folder)
	}
	signature := signParams(params, c.cfg.APISecret)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	for key, value := range params {
		if err := writer.WriteField(key, value); err != nil {
			return nil, err
		}
	}
	if err := writer.WriteField("api_key", c.cfg.APIKey); err != nil {
		return nil, err
	}
	if err := writer.WriteField("signature", signature); err != nil {
		return nil, err
	}

	h := make(textproto.MIMEHeader)
	h.Set("Content-Disposition", fmt.Sprintf(`form-data; name="file"; filename="%s"`, escapeQuotes(filename)))
	h.Set("Content-Type", mimeType)
	part, err := writer.CreatePart(h)
	if err != nil {
		return nil, err
	}
	if _, err := part.Write(data); err != nil {
		return nil, err
	}
	if err := writer.Close(); err != nil {
		return nil, err
	}

	u := fmt.Sprintf("https://api.cloudinary.com/v1_1/%s/image/upload", url.PathEscape(c.cfg.CloudName))
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, u, &body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var payload struct {
		PublicID  string `json:"public_id"`
		SecureURL string `json:"secure_url"`
		Width     int    `json:"width"`
		Height    int    `json:"height"`
		Format    string `json:"format"`
		Error     *struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, err
	}
	if resp.StatusCode >= 400 {
		if payload.Error != nil && strings.TrimSpace(payload.Error.Message) != "" {
			return nil, fmt.Errorf(payload.Error.Message)
		}
		return nil, fmt.Errorf("cloudinary upload failed with status %d", resp.StatusCode)
	}
	if strings.TrimSpace(payload.SecureURL) == "" || strings.TrimSpace(payload.PublicID) == "" {
		return nil, fmt.Errorf("cloudinary upload returned incomplete payload")
	}

	return &UploadResult{
		PublicID:  payload.PublicID,
		SecureURL: payload.SecureURL,
		Width:     payload.Width,
		Height:    payload.Height,
		Format:    payload.Format,
	}, nil
}

func signParams(params map[string]string, apiSecret string) string {
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	parts := make([]string, 0, len(keys))
	for _, key := range keys {
		value := strings.TrimSpace(params[key])
		if value == "" {
			continue
		}
		parts = append(parts, key+"="+value)
	}

	base := strings.Join(parts, "&") + apiSecret
	sum := sha1.Sum([]byte(base))
	return hex.EncodeToString(sum[:])
}

func escapeQuotes(v string) string {
	return strings.NewReplacer("\\", "\\\\", `"`, `\\"`).Replace(v)
}
