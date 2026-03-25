package handlers

// take request - do something with it/ sanatise whatever
// then pass to repo (for db)

type Params struct {
	username string
}

func GetUser(params *Params) bool {
	
}