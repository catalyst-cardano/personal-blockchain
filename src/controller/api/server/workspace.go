package server

import (
	"fmt"
	"net/http"
	"os/exec"
	"path/filepath"

	"controller/entities/request"
	"controller/entities/response"
	"github.com/labstack/echo/v4"
)

// e.POST("/workspace", createWorkSpace)
func (f *internalServer) createWorkSpace(c echo.Context) error {
	var req request.CreateWorkspaceRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	if err := f.validator.Struct(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	scriptPath := "run-docker.sh"
	cmd := exec.Command("bash", scriptPath, fmt.Sprint(req.EpochLength), fmt.Sprint(req.SlotLength), fmt.Sprint(req.TxSize))
	cmd.Dir = filepath.Join(f.rootPath, "script")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	fmt.Println(string(output))

	return c.JSON(http.StatusOK, response.Response[interface{}]{
		Code:    0,
		TraceId: "",
		Message: "",
	})
}
