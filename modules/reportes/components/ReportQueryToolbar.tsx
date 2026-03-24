"use client";

import { useMemo } from "react";
import { Button, Card, CardBody, DatePicker, Select, SelectItem } from "@heroui/react";
import { parseDate, type DateValue } from "@internationalized/date";
import { FileSpreadsheet } from "lucide-react";
import {
  vividDatePickerClassNames,
  vividPopoverContentClass,
  vividSelectClassNames,
  vividSelectListboxProps,
  vividSelectScrollShadowProps,
} from "@/lib/heroUiVivid";

export type ReportPeriodMode = "day" | "month" | "range";

function safeParseYmd(ymd: string): DateValue {
  try {
    return parseDate(ymd);
  } catch {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return parseDate(`${y}-${m}-${day}`);
  }
}

function buildMonthOptions(monthsBack = 48) {
  const out: { key: string; label: string }[] = [];
  const d = new Date();
  for (let i = 0; i < monthsBack; i++) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const y = x.getFullYear();
    const m = x.getMonth() + 1;
    const key = `${y}-${String(m).padStart(2, "0")}`;
    const raw = x.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
    out.push({ key, label: raw.charAt(0).toUpperCase() + raw.slice(1) });
  }
  return out;
}

export interface ReportQueryToolbarProps {
  mode: ReportPeriodMode;
  onModeChange: (m: ReportPeriodMode) => void;
  day: string;
  onDayChange: (v: string) => void;
  monthYm: string;
  onMonthYmChange: (v: string) => void;
  rangeStart: string;
  rangeEnd: string;
  onRangeStartChange: (v: string) => void;
  onRangeEndChange: (v: string) => void;
  loading: boolean;
  onRun: () => void;
  onExport: () => void;
  canExport: boolean;
}

export function ReportQueryToolbar({
  mode,
  onModeChange,
  day,
  onDayChange,
  monthYm,
  onMonthYmChange,
  rangeStart,
  rangeEnd,
  onRangeStartChange,
  onRangeEndChange,
  loading,
  onRun,
  onExport,
  canExport,
}: ReportQueryToolbarProps) {
  const monthOpts = useMemo(() => buildMonthOptions(), []);

  return (
    <Card shadow="sm" radius="lg" className="border border-separator bg-surface">
      <CardBody className="gap-4 p-4 sm:p-5">
        <div className="grid w-full min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-start">
          <Select
            className="w-full min-w-0"
            label="Tipo de reporte"
            labelPlacement="outside-top"
            variant="bordered"
            radius="lg"
            color="primary"
            disallowEmptySelection
            selectedKeys={new Set([mode])}
            classNames={vividSelectClassNames}
            listboxProps={vividSelectListboxProps}
            scrollShadowProps={vividSelectScrollShadowProps}
            popoverProps={{ placement: "bottom-start", offset: 8 }}
            onSelectionChange={(keys) => {
              const k = Array.from(keys)[0] as ReportPeriodMode | undefined;
              if (k) onModeChange(k);
            }}
          >
            <SelectItem key="day">Reporte diario (un día)</SelectItem>
            <SelectItem key="month">Reporte mensual</SelectItem>
            <SelectItem key="range">Entre dos fechas</SelectItem>
          </Select>

          {mode === "day" && (
            <DatePicker
              className="w-full min-w-0"
              label="Día"
              labelPlacement="outside-top"
              variant="bordered"
              radius="lg"
              color="primary"
              classNames={vividDatePickerClassNames}
              value={safeParseYmd(day)}
              onChange={(d) => d && onDayChange(d.toString())}
              showMonthAndYearPickers
              popoverProps={{
                placement: "bottom-start",
                offset: 10,
                classNames: { content: vividPopoverContentClass },
              }}
            />
          )}

          {mode === "month" && (
            <Select
              className="w-full min-w-0"
              label="Mes"
              labelPlacement="outside-top"
              variant="bordered"
              radius="lg"
              color="secondary"
              disallowEmptySelection
              selectedKeys={new Set([monthYm])}
              classNames={vividSelectClassNames}
              listboxProps={vividSelectListboxProps}
              scrollShadowProps={vividSelectScrollShadowProps}
              popoverProps={{ placement: "bottom-start", offset: 8 }}
              onSelectionChange={(keys) => {
                const k = Array.from(keys)[0] as string | undefined;
                if (k) onMonthYmChange(k);
              }}
            >
              {monthOpts.map((o) => (
                <SelectItem key={o.key} textValue={o.label}>
                  {o.label}
                </SelectItem>
              ))}
            </Select>
          )}

          {mode === "range" && (
            <>
              <DatePicker
                className="w-full min-w-0"
                label="Desde"
                labelPlacement="outside-top"
                variant="bordered"
                radius="lg"
                color="primary"
                classNames={vividDatePickerClassNames}
                value={safeParseYmd(rangeStart)}
                onChange={(d) => d && onRangeStartChange(d.toString())}
                showMonthAndYearPickers
                popoverProps={{
                  placement: "bottom-start",
                  offset: 10,
                  classNames: { content: vividPopoverContentClass },
                }}
              />
              <DatePicker
                className="w-full min-w-0"
                label="Hasta"
                labelPlacement="outside-top"
                variant="bordered"
                radius="lg"
                color="warning"
                classNames={vividDatePickerClassNames}
                value={safeParseYmd(rangeEnd)}
                onChange={(d) => d && onRangeEndChange(d.toString())}
                showMonthAndYearPickers
                popoverProps={{
                  placement: "bottom-start",
                  offset: 10,
                  classNames: { content: vividPopoverContentClass },
                }}
              />
            </>
          )}

          <div className="flex min-w-0 flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-1 lg:pt-6">
            <Button
              color="primary"
              radius="lg"
              className="min-h-10 min-w-[140px] flex-1 bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 font-semibold text-white shadow-lg shadow-cyan-500/25"
              isLoading={loading}
              onPress={() => onRun()}
            >
              Generar reporte
            </Button>
            <Button
              color="warning"
              variant="bordered"
              radius="lg"
              className="min-h-10 border-orange-400/50 font-medium text-orange-200"
              startContent={<FileSpreadsheet className="h-4 w-4" />}
              isDisabled={!canExport}
              onPress={onExport}
            >
              Excel
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
