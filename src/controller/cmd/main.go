package main

import (
	"context"
	"log"
	"os"

	"github.com/urfave/cli/v2"
	"go.uber.org/fx"

	"controller/api/server"
	"controller/pkg/config"
)

func main() {
	if err := run(os.Args); err != nil {
		log.Fatal(err)
	}
}

// var app *cli.App
func run(_ []string) error {
	app := cli.NewApp()
	app.Name = "services"
	app.Commands = []*cli.Command{
		{
			Name:   "server",
			Usage:  "start http server",
			Action: serverAction,
		},
	}
	if err := app.Run(os.Args); err != nil {
		panic(err)
	}
	return nil
}

func serverAction(cliCtx *cli.Context) error {
	fx.New(
		fx.Provide(
			config.Load,
		),
		fx.Invoke(runServer),
	).Run()
	return nil
}

func runServer(lifecycle fx.Lifecycle, cfg *config.Config) {
	lifecycle.Append(
		fx.Hook{
			OnStart: func(context.Context) error {
				go func() {
					s := server.NewServer(cfg)

					if err := s.Serve(); err != nil {
						println("error while starting server", err.Error())
						return
					}
				}()
				return nil
			},
		},
	)

}
