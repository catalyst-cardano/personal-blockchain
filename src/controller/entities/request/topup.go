package request

type TopupRequest struct {
	Address string `json:"address" validate:"required"`
	Amount  int64  `json:"amount" validate:"required,gte=1000000,lte=10000000000"`
}
