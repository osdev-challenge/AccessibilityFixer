export function createCanFixByLogic<T>(cond: (ctx: T) => boolean) {
  return (ctx: T) => !!cond(ctx);
}
