{{/*
Sanitize a component name into a valid Kubernetes resource name segment.
Lowercases, replaces anything that is not [a-z0-9-] with -, collapses runs
of dashes, and trims leading/trailing dashes.
*/}}
{{- define "galleon-samples.componentSlug" -}}
{{- regexReplaceAll "[^a-z0-9]+" (. | lower) "-" | trimAll "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "galleon-samples.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
