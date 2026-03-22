package main

import (
	"database/sql"
	"fmt"

	"github.com/gin-gonic/gin"
)

var port string = ":8080";

// postgres db
var db *sql.DB



func home(c *gin.Context) {
	c.JSON(200, gin.H{
		"Message": "Hello",
	})
}

func main() {
	router := gin.Default()

	// get home
	router.GET("/", home)

	fmt.Println("server running on localhost:", port)
	router.Run("localhost" + port)
}
