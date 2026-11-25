export const message = {
  errors: [] as string[],
  error(value: string) {
    this.errors.push(value);
  },
};
