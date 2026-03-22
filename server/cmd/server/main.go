package main

import (
	"log"
	"os"

	"threejsPortfolioServer/internal/config"
	"threejsPortfolioServer/internal/handlers"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func loadPort() string {
	err := godotenv.Load("../.env.local")
	if err != nil {
		log.Fatalf("Error loading .env.local: %v", err)
	}

	port := os.Getenv("PORT")
	if port == "" {
		log.Println("Warning: PORT not set in .env.local, defaulting to 8080")
		port = "8080"
	}
	return port
}

func main() {
	// load port
	port := loadPort()

	cfg, err := config.Load()
	if err != nil {
		log.Printf("couldnt load %v", err)
	}
	log.Printf("whats in the config %v", cfg)

	router := gin.Default()
	println("Setting up server")

	// Get
	router.GET("/", handlers.HandleLoginPage)

	println("Server listening on", port)
	router.Run(":" + port)

}
