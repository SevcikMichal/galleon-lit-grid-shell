package main

import (
	"log"
	"net/http"
	"os"

	"github.com/galleon/backend/handler"
	"github.com/galleon/backend/k8s"
)

func main() {
	client, err := k8s.NewDynamicClient()
	if err != nil {
		log.Fatalf("k8s client: %v", err)
	}

	namespace := os.Getenv("K8S_NAMESPACE")
	if namespace == "" {
		namespace = "default"
	}

	h := handler.NewCellsHandler(client, namespace)

	mux := http.NewServeMux()
	mux.HandleFunc("/api/cells", h.Handle)
	mux.HandleFunc("/api/cells/", h.Handle)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
