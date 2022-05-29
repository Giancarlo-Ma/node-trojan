import chalk from 'chalk';

const { red, green, yellow } = chalk;

export const warn = (message: string) => console.error(yellow(message));
export const error = (message: string) => console.error(red(message));
export const info = (message: string) => console.info(green(message));
