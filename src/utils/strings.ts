/** Devuelve las iniciales de un nombre (máx. 2 letras) */
export function getInitials(nombre: string): string {
  return nombre.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}
