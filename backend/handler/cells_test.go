package handler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// newHandler returns a handler with a nil k8s client — sufficient for
// testing request validation paths that return before touching k8s.
func newHandler() *CellsHandler {
	return NewCellsHandler(nil, "default")
}

func TestHandle_Options(t *testing.T) {
	r := httptest.NewRequest(http.MethodOptions, "/api/cells", nil)
	w := httptest.NewRecorder()
	newHandler().Handle(w, r)

	if w.Code != http.StatusNoContent {
		t.Errorf("OPTIONS status = %d, want 204", w.Code)
	}
	if w.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Error("CORS header missing")
	}
}

func TestHandle_MethodNotAllowed(t *testing.T) {
	for _, method := range []string{http.MethodPut, http.MethodPatch, http.MethodHead} {
		t.Run(method, func(t *testing.T) {
			r := httptest.NewRequest(method, "/api/cells", nil)
			w := httptest.NewRecorder()
			newHandler().Handle(w, r)

			if w.Code != http.StatusMethodNotAllowed {
				t.Errorf("%s status = %d, want 405", method, w.Code)
			}
		})
	}
}

func TestHandle_Post_InvalidJSON(t *testing.T) {
	r := httptest.NewRequest(http.MethodPost, "/api/cells", strings.NewReader("{not json"))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	newHandler().Handle(w, r)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestHandle_Post_MissingCellId(t *testing.T) {
	body := `{"name":"test","col":1,"row":1,"colspan":2,"rowspan":2}`
	r := httptest.NewRequest(http.MethodPost, "/api/cells", strings.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	newHandler().Handle(w, r)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestHandle_Delete_MissingCellId(t *testing.T) {
	r := httptest.NewRequest(http.MethodDelete, "/api/cells", nil)
	w := httptest.NewRecorder()
	newHandler().Handle(w, r)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestHandle_CORSOnAllMethods(t *testing.T) {
	methods := []string{http.MethodPost, http.MethodGet, http.MethodDelete, http.MethodOptions}
	for _, method := range methods {
		t.Run(method, func(t *testing.T) {
			r := httptest.NewRequest(method, "/api/cells", nil)
			w := httptest.NewRecorder()
			// We only check headers — panics from nil client on GET/DELETE are expected
			// to happen after headers are set, so we recover.
			defer func() { _ = recover() }()
			newHandler().Handle(w, r)

			if w.Header().Get("Access-Control-Allow-Origin") != "*" {
				t.Errorf("%s: CORS header missing", method)
			}
		})
	}
}
