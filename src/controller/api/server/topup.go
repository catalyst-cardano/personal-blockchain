package server

import (
	"bytes"
	"net/http"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"

	"github.com/labstack/echo/v4"

	"controller/entities/request"
	"controller/entities/response"
)

const (
	topUpFile = "top-up.sh"
)

var (
	re = regexp.MustCompile(`(?m)([a-zA-Z0-9]{64})#\d{1,3}\.{1,1000}Done`)
)

func (f *internalServer) topUp(c echo.Context) error {
	payload := new(request.TopupRequest)
	if err := c.Bind(payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if err := f.validator.Struct(payload); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	cmd := exec.Command("bash", topUpFile, payload.Address, strconv.FormatInt(payload.Amount, 10))
	cmd.Dir = filepath.Join(f.rootPath, "script")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, bytes.NewBuffer(output).String())
	}

	out := re.FindStringSubmatch(string(output))
	if len(out) < 2 {
		return echo.NewHTTPError(http.StatusBadRequest, "failed to get txId")
	}

	resp := response.Response[response.TopupResponse]{
		Code:    http.StatusOK,
		TraceId: c.Response().Header().Get("X-Trace-Id"),
		Message: "Topup success",
		Data: response.TopupResponse{
			TxId: out[1],
		},
	}
	return c.JSON(http.StatusOK, resp)
}
