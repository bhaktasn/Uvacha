export function authDestination(value: string | null) {
  return value === '/profile' ? '/profile' : '/videos';
}
