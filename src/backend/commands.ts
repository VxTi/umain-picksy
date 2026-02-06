import { InvokeArgs } from "@tauri-apps/api/core";

type SingleCommandConf<Args extends InvokeArgs, Result> = {
  args: Args;
  result: Result;
};

type Photo = {
  id: string;
};
type CommandConf = {
  list_photos: SingleCommandConf<{}, { photos: Photo[] }>;
};

export type Command = keyof CommandConf;
export type Args<C extends Command> = CommandConf[C]["args"];
export type Result<C extends Command> = CommandConf[C]["result"];
