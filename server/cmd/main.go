package main

import (
	"log"
	"os"

	"threejsPortfolioServer/internal/config"
	"threejsPortfolioServer/internal/handlers"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)


func main() {
	if err := godotenv.Load("../.env.local"); err != nil {
		log.Fatal("Error loading .env.local")
	}
	// load port
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("couldnt load %v", err)
	}
	log.Printf("whats in the config %v", cfg)

	router := gin.Default()
	println("Setting up server")

	// Get
	router.GET("/", handlers.HandleLoginPage)

	log.Printf("Server listening on :%s", port)
	router.Run(":" + port)

}
