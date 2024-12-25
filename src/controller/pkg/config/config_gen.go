package config

import (
	"bytes"
	"encoding/json"
	"log"
	"strings"

	"github.com/spf13/viper"
)

// Load system env config
func Load() (*Config, error) {
	/**
	|-------------------------------------------------------------------------
	| hacking to load reflect structure config into env
	|-----------------------------------------------------------------------*/
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./controller")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "__"))
	viper.AutomaticEnv()
	/**
	|-------------------------------------------------------------------------
	| You should set default config value here
	| 1. Populate the default value in (Source code)
	| 2. Then merge from config (YAML) and OS environment
	|-----------------------------------------------------------------------*/
	c := loadDefaultConfig()
	if configBuffer, err := json.Marshal(c); err != nil {
		log.Println("Oops! Marshal config is failed. ", err)
		return nil, err
	} else if err := viper.ReadConfig(bytes.NewBuffer(configBuffer)); err != nil {
		log.Println("Oops! Read default config is failed. ", err)
		return nil, err
	}
	if err := viper.MergeInConfig(); err != nil {
		log.Println("Read config file failed.", err)
	}
	// Populate all config again
	err := viper.Unmarshal(c)
	return c, err
}
