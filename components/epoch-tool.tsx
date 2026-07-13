"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import gsap from "gsap";
import { formatInTimeZone, getTimezoneOffset } from "date-fns-tz";
import {
  Clock,
  Copy,
  Trash2,
  Globe2,
  X,
  RefreshCw,
  AlertCircle,
  CalendarClock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Command,
  CommandInputGroup,
  CommandInput,
  CommandChips,
  CommandChip,
  CommandChipRemove,
  CommandPortal,
  CommandPositioner,
  CommandPopup,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import { TIMEZONE_OPTIONS, type TimezoneOption } from "@/lib/timezones";
import { toast } from "sonner";

type EpochFormat = "auto" | "seconds" | "milliseconds";

function detectFormat(raw: string): "seconds" | "milliseconds" | null {
  const trimmed = raw.trim();
  if (!trimmed || !/^-?\d+$/.test(trimmed)) return null;
  const digits = trimmed.replace("-", "").length;
  return digits >= 13 ? "milliseconds" : "seconds";
}

function toMillis(raw: string, format: EpochFormat): number | null {
  const trimmed = raw.trim();
  if (!trimmed || !/^-?\d+$/.test(trimmed)) return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num)) return null;

  const resolved = format === "auto" ? detectFormat(trimmed) : format;
  return resolved === "milliseconds" ? num : num * 1000;
}

function getTimezoneName(date: Date, zone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      timeZoneName: "long",
    }).formatToParts(date);
    return parts.find((p) => p.type === "timeZoneName")?.value ?? zone;
  } catch {
    return zone;
  }
}

function getUtcOffsetLabel(date: Date, zone: string): string {
  const offsetMs = getTimezoneOffset(zone, date);
  const sign = offsetMs >= 0 ? "+" : "-";
  const totalMinutes = Math.round(Math.abs(offsetMs) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `UTC${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

interface ConversionRow {
  option: TimezoneOption;
  localDate: string;
  localTime: string;
  dayOfWeek: string;
  timezoneName: string;
  utcOffset: string;
}

export default function EpochTool() {
  const [epochInput, setEpochInput] = useState(() => Math.floor(Date.now() / 1000).toString());
  const [format, setFormat] = useState<EpochFormat>("auto");
  const [selectedZones, setSelectedZones] = useState<TimezoneOption[]>([
    TIMEZONE_OPTIONS[0],
    TIMEZONE_OPTIONS.find((z) => z.zone === "America/New_York")!,
  ]);
  const [now, setNow] = useState<number>(() => Date.now());

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".animate-fade-in"),
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power2.out" }
      );
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const detectedFormat = useMemo(() => detectFormat(epochInput), [epochInput]);
  const millis = useMemo(() => toMillis(epochInput, format), [epochInput, format]);
  const date = useMemo(() => (millis !== null ? new Date(millis) : null), [millis]);
  const isValid = date !== null && !isNaN(date.getTime());

  const utcTime = useMemo(() => {
    if (!isValid || !date) return null;
    return formatInTimeZone(date, "UTC", "EEE, MMM d, yyyy HH:mm:ss 'UTC'");
  }, [isValid, date]);

  const rows: ConversionRow[] = useMemo(() => {
    if (!isValid || !date) return [];
    return selectedZones.map((option) => ({
      option,
      localDate: formatInTimeZone(date, option.zone, "MMM d, yyyy"),
      localTime: formatInTimeZone(date, option.zone, "hh:mm:ss a"),
      dayOfWeek: formatInTimeZone(date, option.zone, "EEEE"),
      timezoneName: getTimezoneName(date, option.zone),
      utcOffset: getUtcOffsetLabel(date, option.zone),
    }));
  }, [isValid, date, selectedZones]);

  const copyToClipboard = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  const setToNow = () => {
    setEpochInput(Math.floor(Date.now() / 1000).toString());
    setFormat("auto");
  };

  const clearInput = () => setEpochInput("");

  const removeZone = (id: string) => {
    setSelectedZones((prev) => prev.filter((z) => z.id !== id));
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Current Unix Timestamp Ticker */}
      <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
        <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-teal-400 animate-spin [animation-duration:3s]" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Current Unix Timestamp
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Seconds</span>
              <span className="font-mono text-sm text-zinc-100 tabular-nums">{Math.floor(now / 1000)}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => copyToClipboard(Math.floor(now / 1000).toString(), "Seconds copied!")}
                className="h-6 w-6 text-zinc-500 hover:text-teal-400"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Milliseconds</span>
              <span className="font-mono text-sm text-zinc-100 tabular-nums">{now}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => copyToClipboard(now.toString(), "Milliseconds copied!")}
                className="h-6 w-6 text-zinc-500 hover:text-teal-400"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UTC Time */}
      {isValid && utcTime && (
        <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in">
          <CardHeader className="border-b border-zinc-900 pb-4">
            <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Globe2 className="w-4 h-4 text-teal-400" /> UTC Time
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <span className="font-mono text-sm text-zinc-200">{utcTime}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => copyToClipboard(utcTime, "UTC time copied!")}
              className="text-zinc-500 hover:text-teal-400"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-6">
          {/* Epoch Input */}
          <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
            <CardHeader>
              <CardTitle className="text-zinc-50 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-400" />
                Epoch Time Converter
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Enter a Unix epoch timestamp in seconds or milliseconds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="epoch-input" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                  Epoch Timestamp
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="epoch-input"
                    value={epochInput}
                    onChange={(e) => setEpochInput(e.target.value)}
                    placeholder="1700000000"
                    className="bg-zinc-900/60 border-zinc-700 focus:border-teal-500/50 text-zinc-100 placeholder-zinc-600 font-mono text-sm"
                  />
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="outline"
                          onClick={() => copyToClipboard(epochInput, "Timestamp copied!")}
                          className="border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:text-teal-400 hover:border-teal-500/40 shrink-0"
                          size="icon"
                        />
                      }
                    >
                      <Copy className="w-4 h-4" />
                    </TooltipTrigger>
                    <TooltipContent>Copy timestamp</TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    variant="ghost"
                    onClick={setToNow}
                    className="text-zinc-400 hover:text-teal-400 hover:bg-teal-500/10 text-xs h-8"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" /> Use current time
                  </Button>
                  {epochInput && (
                    <Button
                      variant="ghost"
                      onClick={clearInput}
                      className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 text-xs h-8"
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Clear
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                  Format
                </Label>
                <Select value={format} onValueChange={(v) => setFormat(v as EpochFormat)}>
                  <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-700 text-zinc-100">
                    <SelectValue placeholder="Auto-detect" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      Auto-detect{detectedFormat ? ` (${detectedFormat})` : ""}
                    </SelectItem>
                    <SelectItem value="seconds">Seconds</SelectItem>
                    <SelectItem value="milliseconds">Milliseconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {epochInput && (
                <div className="flex items-center gap-2">
                  {isValid ? (
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                      Valid timestamp
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-400">
                      <AlertCircle className="w-3 h-3" /> Invalid timestamp
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        <div className="lg:col-span-7 space-y-6">
          {/* Timezone Picker */}
          <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in">
            <CardHeader className="border-b border-zinc-900 pb-4">
              <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <CalendarClock className="w-4 h-4 text-teal-400" /> Compare Countries / Timezones
              </CardTitle>
              <CardDescription className="text-zinc-500 text-xs">
                Search and add multiple locations to compare the same instant across timezones.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <Command<TimezoneOption, true>
                items={TIMEZONE_OPTIONS}
                multiple
                value={selectedZones}
                onValueChange={(next) => setSelectedZones(next)}
                itemToStringLabel={(item) => `${item.country} ${item.city}`}
              >
                <div className="relative">
                  <CommandInputGroup>
                    <CommandChips>
                      {selectedZones.map((zone) => (
                        <CommandChip key={zone.id}>
                          {zone.country} — {zone.city}
                          <CommandChipRemove
                            aria-label={`Remove ${zone.country}`}
                            onClick={() => removeZone(zone.id)}
                          >
                            <X className="w-3 h-3" />
                          </CommandChipRemove>
                        </CommandChip>
                      ))}
                      <CommandInput placeholder={selectedZones.length ? "" : "Search country or city..."} />
                    </CommandChips>
                  </CommandInputGroup>
                  <CommandPortal>
                    <CommandPositioner>
                      <CommandPopup>
                        <CommandEmpty>No matching country or timezone.</CommandEmpty>
                        <CommandList>
                          {(item: TimezoneOption) => (
                            <CommandItem key={item.id} value={item}>
                              {item.country} — {item.city}
                            </CommandItem>
                          )}
                        </CommandList>
                      </CommandPopup>
                    </CommandPositioner>
                  </CommandPortal>
                </div>
              </Command>
            </CardContent>
          </Card>

          {!isValid && epochInput && (
            <Card className="bg-rose-500/5 border-rose-500/20 backdrop-blur-xl animate-fade-in">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertCircle className="w-5 h-5" />
                  <p className="font-semibold text-sm">Invalid Epoch Timestamp</p>
                </div>
                <p className="text-xs text-rose-300/80">
                  Enter a numeric Unix timestamp in seconds (e.g. 1700000000) or milliseconds (e.g. 1700000000000).
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      {isValid && rows.length > 0 && (
        <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in">
          <CardHeader className="border-b border-zinc-900 pb-4">
            <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Globe2 className="w-4 h-4 text-teal-400" /> Local Time by Location
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-900 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Location</TableHead>
                  <TableHead className="text-zinc-400">Local Date</TableHead>
                  <TableHead className="text-zinc-400">Local Time</TableHead>
                  <TableHead className="text-zinc-400">Day</TableHead>
                  <TableHead className="text-zinc-400">Timezone</TableHead>
                  <TableHead className="text-zinc-400">UTC Offset</TableHead>
                  <TableHead className="text-zinc-400 text-right">Copy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.option.id} className="border-zinc-900">
                    <TableCell className="text-zinc-200 font-medium">
                      {row.option.country}
                      <div className="text-[10px] text-zinc-500 font-normal">{row.option.city}</div>
                    </TableCell>
                    <TableCell className="text-zinc-300 font-mono text-xs">{row.localDate}</TableCell>
                    <TableCell className="text-zinc-300 font-mono text-xs">{row.localTime}</TableCell>
                    <TableCell className="text-zinc-300 text-xs">{row.dayOfWeek}</TableCell>
                    <TableCell className="text-zinc-400 text-xs">
                      <Tooltip>
                        <TooltipTrigger render={<span className="cursor-default" />}>
                          {row.timezoneName}
                        </TooltipTrigger>
                        <TooltipContent>{row.option.zone}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-zinc-400 font-mono text-xs">{row.utcOffset}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          copyToClipboard(
                            `${row.option.country} (${row.option.city}): ${row.localDate} ${row.localTime} ${row.dayOfWeek}, ${row.timezoneName} (${row.utcOffset})`,
                            `${row.option.country} copied!`
                          )
                        }
                        className="text-zinc-500 hover:text-teal-400"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
