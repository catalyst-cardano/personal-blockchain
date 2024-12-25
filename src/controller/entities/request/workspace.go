package request

type CreateWorkspaceRequest struct {
	SlotLength  int `json:"slotLength" validate:"required"`
	EpochLength int `json:"epochLength" validate:"required"`
	TxSize      int `json:"txSize" validate:"required"`
}
