package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	k8sclient "github.com/galleon/backend/k8s"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/client-go/dynamic"
)

type CellsHandler struct {
	client      dynamic.Interface
	namespace   string
	mfName      string
	mfNamespace string
}

func NewCellsHandler(client dynamic.Interface, namespace, mfName, mfNamespace string) *CellsHandler {
	return &CellsHandler{
		client:      client,
		namespace:   namespace,
		mfName:      mfName,
		mfNamespace: mfNamespace,
	}
}

func setCORSHeaders(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func (h *CellsHandler) Handle(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	// Determine if there's a cellId in the path: /api/cells/{cellId}
	cellID := strings.TrimPrefix(r.URL.Path, "/api/cells/")
	cellID = strings.TrimPrefix(cellID, "/api/cells")
	cellID = strings.Trim(cellID, "/")

	switch r.Method {
	case http.MethodPost:
		h.createOrUpdate(w, r)
	case http.MethodGet:
		h.list(w, r)
	case http.MethodDelete:
		if cellID == "" {
			writeError(w, http.StatusBadRequest, "missing cellId in path")
			return
		}
		h.delete(w, r, cellID)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// upsert creates the resource if it doesn't exist, or replaces it if it does.
// Returns true if the resource was newly created.
func (h *CellsHandler) upsert(ctx context.Context, obj *unstructured.Unstructured) (bool, error) {
	res := h.client.Resource(k8sclient.WebComponentGVR).Namespace(h.namespace)
	_, err := res.Create(ctx, obj, metav1.CreateOptions{})
	if err == nil {
		return true, nil
	}
	if !k8serrors.IsAlreadyExists(err) {
		return false, err
	}
	existing, err := res.Get(ctx, obj.GetName(), metav1.GetOptions{})
	if err != nil {
		return false, err
	}
	obj.SetResourceVersion(existing.GetResourceVersion())
	_, err = res.Update(ctx, obj, metav1.UpdateOptions{})
	return false, err
}

func (h *CellsHandler) createOrUpdate(w http.ResponseWriter, r *http.Request) {
	var req k8sclient.SaveCellRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}
	if req.CellID == "" {
		writeError(w, http.StatusBadRequest, "cellId is required")
		return
	}

	ctx := context.Background()

	cellObj := k8sclient.BuildCellWebComponent(h.namespace, h.mfName, h.mfNamespace, req)
	created, err := h.upsert(ctx, cellObj)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to upsert cell resource: "+err.Error())
		return
	}

	if req.WidgetTag != "" {
		widgetObj := k8sclient.BuildWidgetWebComponent(h.namespace, req)
		if _, err := h.upsert(ctx, widgetObj); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to upsert widget resource: "+err.Error())
			return
		}
	}

	status := http.StatusOK
	if created {
		status = http.StatusCreated
	}
	writeJSON(w, status, map[string]string{
		"name":      cellObj.GetName(),
		"namespace": cellObj.GetNamespace(),
	})
}

func (h *CellsHandler) list(w http.ResponseWriter, r *http.Request) {
	list, err := h.client.Resource(k8sclient.WebComponentGVR).Namespace(h.namespace).List(
		context.Background(),
		metav1.ListOptions{
			LabelSelector: "app.kubernetes.io/managed-by=galleon,galleon/resource-type=cell",
		},
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list resources: "+err.Error())
		return
	}

	type item struct {
		Name      string `json:"name"`
		Namespace string `json:"namespace"`
	}
	items := make([]item, 0, len(list.Items))
	for _, obj := range list.Items {
		items = append(items, item{Name: obj.GetName(), Namespace: obj.GetNamespace()})
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *CellsHandler) delete(w http.ResponseWriter, r *http.Request, cellID string) {
	ctx := context.Background()
	res := h.client.Resource(k8sclient.WebComponentGVR).Namespace(h.namespace)

	cellName := k8sclient.SanitizeName("galleon-cell-" + cellID)
	if err := res.Delete(ctx, cellName, metav1.DeleteOptions{}); err != nil && !k8serrors.IsNotFound(err) {
		writeError(w, http.StatusInternalServerError, "failed to delete cell resource: "+err.Error())
		return
	}

	widgetName := k8sclient.SanitizeName("galleon-widget-" + cellID)
	if err := res.Delete(ctx, widgetName, metav1.DeleteOptions{}); err != nil && !k8serrors.IsNotFound(err) {
		writeError(w, http.StatusInternalServerError, "failed to delete widget resource: "+err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
