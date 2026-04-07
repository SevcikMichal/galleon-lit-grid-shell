package main

import (
	"log"
	"net/http"
	"os"
	"time"

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

	passwordHash := os.Getenv("ADMIN_PASSWORD_HASH")
	jwtSecret := os.Getenv("JWT_SECRET")

	sessionDuration := 8 * time.Hour
	if d, err := time.ParseDuration(os.Getenv("SESSION_DURATION")); err == nil && d > 0 {
		sessionDuration = d
	}

	cellsHandler := handler.NewCellsHandler(client, namespace)
	authHandler := handler.NewAuthHandler(passwordHash, jwtSecret, sessionDuration)

	mux := http.NewServeMux()

	// Auth endpoints — no auth required.
	mux.HandleFunc("/api/auth/", authHandler.Handle)

	// Cell read endpoint — no auth required.
	mux.HandleFunc("/api/cells", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet || r.Method == http.MethodOptions {
			cellsHandler.Handle(w, r)
			return
		}
		// Mutating methods require auth.
		handler.RequireAuth(passwordHash, jwtSecret, cellsHandler.Handle)(w, r)
	})
	mux.HandleFunc("/api/cells/", func(w http.ResponseWriter, r *http.Request) {
		handler.RequireAuth(passwordHash, jwtSecret, cellsHandler.Handle)(w, r)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("listening on :%s (auth enabled: %v)", port, passwordHash != "")
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
