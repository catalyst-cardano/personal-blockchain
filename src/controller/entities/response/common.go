package response

type Response[T any] struct {
	Code    int    `json:"code"`
	TraceId string `json:"traceId"`
	Message string `json:"message"`
	Data    T      `json:"data,omitempty"`
}
