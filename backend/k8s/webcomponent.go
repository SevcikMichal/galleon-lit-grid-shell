package k8s

import (
	"encoding/json"
	"strconv"
	"strings"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

var WebComponentGVR = schema.GroupVersionResource{
	Group:    "polyfea.github.io",
	Version:  "v1alpha1",
	Resource: "webcomponents",
}

type SaveCellRequest struct {
	CellID          string            `json:"cellId"`
	Name            string            `json:"name"`
	Col             int               `json:"col"`
	Row             int               `json:"row"`
	Colspan         int               `json:"colspan"`
	Rowspan         int               `json:"rowspan"`
	WidgetTag       string            `json:"widgetTag"`
	WidgetName      string            `json:"widgetName"`
	WidgetNamespace string            `json:"widgetNamespace"`
	WidgetAttrs     map[string]string `json:"widgetAttrs"`
	MfName          string            `json:"mfName"`
	MfNamespace     string            `json:"mfNamespace"`
}

// BuildCellWebComponent builds the CRD that represents the galleon-cell element
// itself, rendered into the galleon-canvas polyfea context.
func BuildCellWebComponent(namespace string, req SaveCellRequest) *unstructured.Unstructured {
	attrs := []interface{}{
		map[string]interface{}{"name": "cell-id", "value": req.CellID},
		map[string]interface{}{"name": "col", "value": strconv.Itoa(req.Col)},
		map[string]interface{}{"name": "row", "value": strconv.Itoa(req.Row)},
		map[string]interface{}{"name": "colspan", "value": strconv.Itoa(req.Colspan)},
		map[string]interface{}{"name": "rowspan", "value": strconv.Itoa(req.Rowspan)},
		map[string]interface{}{"name": "name", "value": req.Name},
	}
	if req.WidgetTag != "" {
		attrs = append(attrs, map[string]interface{}{"name": "widget-tag", "value": req.WidgetTag})
	}
	if req.WidgetName != "" {
		attrs = append(attrs, map[string]interface{}{"name": "widget-name", "value": req.WidgetName})
	}
	if req.WidgetNamespace != "" {
		attrs = append(attrs, map[string]interface{}{"name": "widget-namespace", "value": req.WidgetNamespace})
	}
	if len(req.WidgetAttrs) > 0 {
		attrsJSON, _ := json.Marshal(req.WidgetAttrs)
		attrs = append(attrs, map[string]interface{}{"name": "widget-attrs", "value": string(attrsJSON)})
	}

	spec := map[string]interface{}{
		"element":    "galleon-cell",
		"attributes": attrs,
		"displayRules": []interface{}{
			map[string]interface{}{
				"allOf": []interface{}{
					map[string]interface{}{"context-name": "galleon-canvas"},
				},
			},
		},
	}
	if req.MfName != "" {
		mf := map[string]interface{}{"name": req.MfName}
		if req.MfNamespace != "" {
			mf["namespace"] = req.MfNamespace
		}
		spec["microFrontend"] = mf
	}

	return &unstructured.Unstructured{
		Object: map[string]interface{}{
			"apiVersion": "polyfea.github.io/v1alpha1",
			"kind":       "WebComponent",
			"metadata": map[string]interface{}{
				"name":      SanitizeName("galleon-cell-" + req.CellID),
				"namespace": namespace,
				"labels": map[string]interface{}{
					"app.kubernetes.io/managed-by": "galleon",
					"galleon/cell-id":              req.CellID,
					"galleon/resource-type":        "cell",
				},
			},
			"spec": spec,
		},
	}
}

// BuildWidgetWebComponent builds the CRD that represents the inner widget element,
// rendered into the galleon-cell-{cellId} polyfea context.
func BuildWidgetWebComponent(namespace string, req SaveCellRequest) *unstructured.Unstructured {
	attrs := make([]interface{}, 0, len(req.WidgetAttrs))
	for k, v := range req.WidgetAttrs {
		attrs = append(attrs, map[string]interface{}{"name": k, "value": v})
	}

	return &unstructured.Unstructured{
		Object: map[string]interface{}{
			"apiVersion": "polyfea.github.io/v1alpha1",
			"kind":       "WebComponent",
			"metadata": map[string]interface{}{
				"name":      SanitizeName("galleon-widget-" + req.CellID),
				"namespace": namespace,
				"labels": map[string]interface{}{
					"app.kubernetes.io/managed-by": "galleon",
					"galleon/cell-id":              req.CellID,
					"galleon/resource-type":        "widget",
				},
			},
			"spec": func() map[string]interface{} {
				spec := map[string]interface{}{
					"element":    req.WidgetTag,
					"attributes": attrs,
					"displayRules": []interface{}{
						map[string]interface{}{
							"allOf": []interface{}{
								map[string]interface{}{"context-name": "galleon-cell-" + req.CellID},
							},
						},
					},
				}
				if req.WidgetName != "" {
					mf := map[string]interface{}{"name": req.WidgetName}
					if req.WidgetNamespace != "" {
						mf["namespace"] = req.WidgetNamespace
					}
					spec["microFrontend"] = mf
				}
				return spec
			}(),
		},
	}
}

func SanitizeName(s string) string {
	s = strings.ToLower(s)
	var b strings.Builder
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			b.WriteRune(r)
		} else {
			b.WriteRune('-')
		}
	}
	return strings.Trim(b.String(), "-")
}
