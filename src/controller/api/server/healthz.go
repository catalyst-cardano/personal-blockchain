package server

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

func ready(c echo.Context) error {
	return c.String(http.StatusOK, "ok")
}

func liveness(c echo.Context) error {
	return c.String(http.StatusOK, "ok")
}
