package server

import (
	"io"
	"net/http"
	"strings"

	"controller/pkg/config"
	"github.com/gorilla/mux"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

type Server struct {
	cfg    *config.Config
	router *mux.Router
}

func NewServer(cfg *config.Config) *Server {
	return &Server{
		cfg:    cfg,
		router: mux.NewRouter(),
	}
}

func (s *Server) initRoutes() (*echo.Echo, error) {
	e := echo.New()
	// Middleware to handle CORS preflight requests (OPTIONS)
	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Set CORS headers
			c.Response().Header().Set("Access-Control-Allow-Origin", "*")
			c.Response().Header().Set("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT")
			c.Response().Header().Set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-client-key, x-client-token, x-client-secret, Authorization")

			// If the request method is OPTIONS, respond with 200 OK and stop further processing
			if c.Request().Method == http.MethodOptions {
				return c.NoContent(http.StatusOK)
			}

			// Continue to the next handler
			return next(c)
		}
	})

	e.Use(middleware.CORS())
	mappingPrefix := map[string]string{
		"blockfrost": s.cfg.Blockfrost,
		"wallet":     s.cfg.CardanoWallet,
	}

	server, err := newInternalServer()
	if err != nil {
		return nil, err
	}

	healthG := e.Group("/healthz")
	healthG.GET("/ready", ready)
	healthG.GET("/liveness", liveness)

	e.POST("/top-up", server.topUp)
	e.POST("/workspace", server.createWorkSpace)
	e.Any("/*", func(c echo.Context) error {
		path := c.Request().URL.Path
		segments := strings.SplitN(strings.TrimPrefix(path, "/"), "/", 2)
		if len(segments) < 1 {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid prefix"})
		}

		prefix := segments[0]
		targetBase, exists := mappingPrefix[prefix]
		if !exists {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "unknown service"})
		}

		// Reconstruct the forwarded path
		forwardPath := "/"
		if len(segments) > 1 {
			forwardPath += segments[1]
		}

		// Build the target URL
		targetURL := targetBase + forwardPath

		// Create a new request
		req, err := http.NewRequest(c.Request().Method, targetURL, c.Request().Body)
		if err != nil {
			return err
		}

		// Copy headers
		for key, values := range c.Request().Header {
			for _, value := range values {
				req.Header.Add(key, value)
			}
		}

		// Forward the query parameters
		req.URL.RawQuery = c.QueryString()

		// Send the request
		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			return err
		}
		defer resp.Body.Close()

		// Copy the response back to the client
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return err
		}
		return c.Blob(resp.StatusCode, resp.Header.Get("Content-Type"), body)
	})

	return e, nil
}

func (s *Server) Serve() error {
	e, err := s.initRoutes()
	if err != nil {
		return err
	}
	return e.Start(":8888")
}
