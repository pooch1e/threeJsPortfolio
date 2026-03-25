package handlers

import "log"

// take request - do something with it/ sanatise whatever
// then pass to repo (for db)

func SanitizeQueryParam(queryParam string) map[string]any {
	log.Printf("query param is %s", queryParam)
	var status bool = false
	if queryParam != "" {
		status = true
	}
	return map[string]any{queryParam: "logged In", "status": status}
}
