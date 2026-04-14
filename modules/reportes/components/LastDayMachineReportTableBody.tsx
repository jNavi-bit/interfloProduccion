import type { InstantLastDayReportSuccess } from "../instantLastDayReportActions";

type LastDayMachineReportTableBodyProps = {
  report: InstantLastDayReportSuccess;
  /** Clases del contenedor con scroll (altura máx.). */
  scrollClassName?: string;
};

/**
 * Tabla y avisos del reporte rápido por máquina (último día con datos).
 * Sin estado: sirve en servidor (home) y dentro del modal del botón en captura.
 */
export function LastDayMachineReportTableBody({
  report,
  scrollClassName = "max-h-[min(60vh,28rem)]",
}: LastDayMachineReportTableBodyProps) {
  return (
    <>
      {(report.productividadUnmatchedRows > 0 ||
        report.productividadOmittedRows > 0) && (
        <p className="mb-3 text-xs text-amber-200/90">
          Productividad:{" "}
          {report.productividadUnmatchedRows > 0 && (
            <>
              {report.productividadUnmatchedRows} fila
              {report.productividadUnmatchedRows !== 1 ? "s" : ""} sin regla aplicable
            </>
          )}
          {report.productividadUnmatchedRows > 0 &&
            report.productividadOmittedRows > 0 &&
            " · "}
          {report.productividadOmittedRows > 0 && (
            <>
              {report.productividadOmittedRows} omitida
              {report.productividadOmittedRows !== 1 ? "s" : ""} por configuración
            </>
          )}
          . Los kilos y metros incluyen todas las filas del día.
        </p>
      )}
      <div className="ui-table-wrap overflow-hidden">
        <div className={`overflow-auto ${scrollClassName}`}>
          <table className="ui-table min-w-[640px]">
            <thead>
              <tr>
                <th className="whitespace-nowrap px-4 py-3">Máquina</th>
                <th className="whitespace-nowrap px-4 py-3">No. máquina</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Kilos</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Metros</th>
                <th className="px-4 py-3">Productividad</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r) => (
                <tr key={`${r.maquina}|${r.noMaquinaLabel}`}>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                    {r.maquina}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                    {r.noMaquinaLabel}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums text-amber-200">
                    {r.kilos.toLocaleString("es-MX", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums text-sky-300">
                    {r.metros.toLocaleString("es-MX", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="max-w-[280px] px-4 py-3 text-xs text-orange-100">
                    {r.productividad}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
