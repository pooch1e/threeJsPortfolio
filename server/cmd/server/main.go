package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func loadEnv() string {
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
	// load env variable
	port := loadEnv()

	router := gin.Default()
	println("Setting up server")

	println("Server listening on", port)
	router.Run(":" + port)

}
