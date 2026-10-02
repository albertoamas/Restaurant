/** Monto en bolivianos con dos decimales: "Bs 65.00". El único formato de dinero de la app. */
export const bs = (n: number) => `Bs ${n.toFixed(2)}`;
