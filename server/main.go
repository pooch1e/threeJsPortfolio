package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func home(c *gin.Context) {
	c.JSON(200, gin.H{
		"Message": "Hello",
	})
}

func main() {
	router := gin.Default()

	// get home
	router.GET("/", home)
}
