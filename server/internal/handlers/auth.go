package handlers

import "github.com/gin-gonic/gin"

func HandleLoginPage(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "login",
	})
}
