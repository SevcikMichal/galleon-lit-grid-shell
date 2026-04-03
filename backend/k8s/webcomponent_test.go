package k8s

import (
	"testing"
)

func TestSanitizeName(t *testing.T) {
	cases := []struct {
		input string
		want  string
	}{
		{"galleon-cell-abc123", "galleon-cell-abc123"},
		{"Galleon Cell ABC", "galleon-cell-abc"},
		{"--leading-trailing--", "leading-trailing"},
		{"special!@#chars", "special---chars"},
		{"UPPERCASE", "uppercase"},
		{"mixed-123-CASE", "mixed-123-case"},
		{"galleon-cell-86f99092-1782-4dd5-b7d5-e75bf254ca02", "galleon-cell-86f99092-1782-4dd5-b7d5-e75bf254ca02"},
	}
	for _, c := range cases {
		t.Run(c.input, func(t *testing.T) {
			got := SanitizeName(c.input)
			if got != c.want {
				t.Errorf("SanitizeName(%q) = %q, want %q", c.input, got, c.want)
			}
		})
	}
}

func TestBuildCellWebComponent_Structure(t *testing.T) {
	req := SaveCellRequest{
		CellID:  "abc-123",
		Name:    "My Cell",
		Col:     3,
		Row:     2,
		Colspan: 4,
		Rowspan: 2,
	}
	obj := BuildCellWebComponent("default", req)

	if obj.GetKind() != "WebComponent" {
		t.Errorf("kind = %q, want WebComponent", obj.GetKind())
	}
	if obj.GetNamespace() != "default" {
		t.Errorf("namespace = %q, want default", obj.GetNamespace())
	}
	if obj.GetName() != "galleon-cell-abc-123" {
		t.Errorf("name = %q, want galleon-cell-abc-123", obj.GetName())
	}

	labels := obj.GetLabels()
	if labels["galleon/resource-type"] != "cell" {
		t.Errorf("label resource-type = %q, want cell", labels["galleon/resource-type"])
	}
	if labels["galleon/cell-id"] != "abc-123" {
		t.Errorf("label cell-id = %q, want abc-123", labels["galleon/cell-id"])
	}

	spec := obj.Object["spec"].(map[string]interface{})
	if spec["element"] != "galleon-cell" {
		t.Errorf("element = %q, want galleon-cell", spec["element"])
	}

	// Verify context-name in displayRules
	rules := spec["displayRules"].([]interface{})
	allOf := rules[0].(map[string]interface{})["allOf"].([]interface{})
	ctxName := allOf[0].(map[string]interface{})["context-name"]
	if ctxName != "galleon-canvas" {
		t.Errorf("context-name = %q, want galleon-canvas", ctxName)
	}
}

func TestBuildCellWebComponent_WithMicroFrontend(t *testing.T) {
	req := SaveCellRequest{
		CellID:      "abc",
		MfName:      "my-mf",
		MfNamespace: "my-ns",
	}
	obj := BuildCellWebComponent("default", req)
	spec := obj.Object["spec"].(map[string]interface{})

	mf, ok := spec["microFrontend"].(map[string]interface{})
	if !ok {
		t.Fatal("microFrontend not set")
	}
	if mf["name"] != "my-mf" {
		t.Errorf("mf name = %q, want my-mf", mf["name"])
	}
	if mf["namespace"] != "my-ns" {
		t.Errorf("mf namespace = %q, want my-ns", mf["namespace"])
	}
}

func TestBuildCellWebComponent_NoMicroFrontendWhenEmpty(t *testing.T) {
	req := SaveCellRequest{CellID: "abc"}
	obj := BuildCellWebComponent("default", req)
	spec := obj.Object["spec"].(map[string]interface{})

	if _, ok := spec["microFrontend"]; ok {
		t.Error("microFrontend should not be set when MfName is empty")
	}
}

func TestBuildCellWebComponent_OptionalWidgetAttrs(t *testing.T) {
	req := SaveCellRequest{
		CellID:    "abc",
		WidgetTag: "my-widget",
		WidgetAttrs: map[string]string{
			"src": "http://example.com",
		},
	}
	obj := BuildCellWebComponent("default", req)
	spec := obj.Object["spec"].(map[string]interface{})
	attrs := spec["attributes"].([]interface{})

	found := map[string]string{}
	for _, a := range attrs {
		m := a.(map[string]interface{})
		found[m["name"].(string)] = m["value"].(string)
	}
	if found["widget-tag"] != "my-widget" {
		t.Errorf("widget-tag attr = %q, want my-widget", found["widget-tag"])
	}
	if found["widget-attrs"] == "" {
		t.Error("widget-attrs should be set when WidgetAttrs is non-empty")
	}
}

func TestBuildWidgetWebComponent_ContextName(t *testing.T) {
	req := SaveCellRequest{
		CellID:    "cell-xyz",
		WidgetTag: "img",
	}
	obj := BuildWidgetWebComponent("default", req)

	if obj.GetName() != "galleon-widget-cell-xyz" {
		t.Errorf("name = %q, want galleon-widget-cell-xyz", obj.GetName())
	}

	spec := obj.Object["spec"].(map[string]interface{})
	rules := spec["displayRules"].([]interface{})
	allOf := rules[0].(map[string]interface{})["allOf"].([]interface{})
	ctxName := allOf[0].(map[string]interface{})["context-name"]
	if ctxName != "galleon-cell-cell-xyz" {
		t.Errorf("context-name = %q, want galleon-cell-cell-xyz", ctxName)
	}
}

func TestBuildWidgetWebComponent_NoMicroFrontendWhenWidgetNameEmpty(t *testing.T) {
	req := SaveCellRequest{
		CellID:    "abc",
		WidgetTag: "img",
		WidgetName: "",
	}
	obj := BuildWidgetWebComponent("default", req)
	spec := obj.Object["spec"].(map[string]interface{})

	if _, ok := spec["microFrontend"]; ok {
		t.Error("microFrontend should not be set when WidgetName is empty")
	}
}

func TestBuildWidgetWebComponent_WithMicroFrontend(t *testing.T) {
	req := SaveCellRequest{
		CellID:     "abc",
		WidgetTag:  "my-widget",
		WidgetName: "widget-mf",
	}
	obj := BuildWidgetWebComponent("default", req)
	spec := obj.Object["spec"].(map[string]interface{})

	mf, ok := spec["microFrontend"].(map[string]interface{})
	if !ok {
		t.Fatal("microFrontend not set")
	}
	if mf["name"] != "widget-mf" {
		t.Errorf("mf name = %q, want widget-mf", mf["name"])
	}
}

func TestBuildWidgetWebComponent_WidgetAttrsAsAttributes(t *testing.T) {
	req := SaveCellRequest{
		CellID:    "abc",
		WidgetTag: "img",
		WidgetAttrs: map[string]string{
			"src": "http://example.com/img.png",
			"alt": "An image",
		},
	}
	obj := BuildWidgetWebComponent("default", req)
	spec := obj.Object["spec"].(map[string]interface{})
	attrs := spec["attributes"].([]interface{})

	found := map[string]string{}
	for _, a := range attrs {
		m := a.(map[string]interface{})
		found[m["name"].(string)] = m["value"].(string)
	}
	if found["src"] != "http://example.com/img.png" {
		t.Errorf("src attr = %q", found["src"])
	}
	if found["alt"] != "An image" {
		t.Errorf("alt attr = %q", found["alt"])
	}
}
