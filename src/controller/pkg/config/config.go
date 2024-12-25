// YOU CAN EDIT YOUR CUSTOM CONFIG HERE
package config

// Config application
type Config struct {
	Blockfrost    string `json:"blockfrost" mapstructure:"blockfrost"`
	CardanoWallet string `json:"cardano_wallet" mapstructure:"cardano_wallet"`
}

func loadDefaultConfig() *Config {
	c := &Config{
		Blockfrost:    "http://localhost:3000",
		CardanoWallet: "http://localhost:8090",
	}
	return c
}
