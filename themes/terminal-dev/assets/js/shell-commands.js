export function tokenize(input) {
  return input.trim().split(/\s+/).filter(Boolean);
}

export const commands = [];

export function dispatch(input, ctx) {
  const tokens = tokenize(input);
  if (tokens.length === 0) return;
  const [name, ...args] = tokens;
  const cmd = commands.find((c) => c.name === name);
  if (!cmd) {
    ctx.print(`zsh: command not found: ${name}`);
    return;
  }
  cmd.run(ctx, args);
}
