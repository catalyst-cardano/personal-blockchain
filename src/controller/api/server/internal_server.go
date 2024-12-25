package server

import (
	"fmt"
	"os"

	"github.com/go-playground/validator/v10"
)

type internalServer struct {
	rootPath  string
	validator *validator.Validate
}

func newInternalServer() (*internalServer, error) {
	root, err := os.Getwd()
	if err != nil {
		fmt.Println("Error:", err)
		return nil, err
	}
	return &internalServer{
		rootPath:  root,
		validator: validator.New(),
	}, nil
}
