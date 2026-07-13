"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  Clock,
  Calendar,
  Copy,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Cron parsing and translation
interface CronField {
  min: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

function parseCronExpression(cron: string): CronField | null {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return null;

  return {
    min: parts[0],
    hour: parts[1],
    dayOfMonth: parts[2],
    month: parts[3],
    dayOfWeek: parts[4],
  };
}

function translateField(field: string, type: "min" | "hour" | "dayOfMonth" | "month" | "dayOfWeek"): string {
  if (field === "*") {
    switch (type) {
      case "min": return "every minute";
      case "hour": return "every hour";
      case "dayOfMonth": return "every day";
      case "month": return "every month";
      case "dayOfWeek": return "every day of the week";
    }
  }

  if (field === "?") {
    return "no specific value";
  }

  // Handle ranges (e.g., 1-5)
  if (field.includes("-")) {
    const [start, end] = field.split("-");
    return `from ${start} to ${end}`;
  }

  // Handle lists (e.g., 1,3,5)
  if (field.includes(",")) {
    const values = field.split(",");
    if (values.length <= 2) {
      return values.join(" and ");
    }
    return `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}`;
  }

  // Handle steps (e.g., */5 or 1-10/2)
  if (field.includes("/")) {
    const [base, step] = field.split("/");
    if (base === "*") {
      return `every ${step} ${type === "min" ? "minutes" : type === "hour" ? "hours" : ""}`;
    }
    return `every ${step} from ${base}`;
  }

  // Handle specific values
  switch (type) {
    case "month":
      const months = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      return months[parseInt(field)] || field;
    case "dayOfWeek":
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayIndex = parseInt(field);
      if (!isNaN(dayIndex)) {
        return days[dayIndex % 7] || field;
      }
      return field;
    default:
      return field;
  }
}

function translateCronToHuman(cron: string): string | null {
  const parsed = parseCronExpression(cron);
  if (!parsed) return null;

  const min = translateField(parsed.min, "min");
  const hour = translateField(parsed.hour, "hour");
  const dayOfMonth = translateField(parsed.dayOfMonth, "dayOfMonth");
  const month = translateField(parsed.month, "month");
  const dayOfWeek = translateField(parsed.dayOfWeek, "dayOfWeek");

  let result = "";

  // Special case for common patterns
  if (cron === "* * * * *") {
    return "Every minute";
  }
  if (cron === "0 * * * *") {
    return "Every hour";
  }
  if (cron === "0 0 * * *") {
    return "Every day at midnight";
  }
  if (cron === "0 0 * * 0") {
    return "Every Sunday at midnight";
  }
  if (cron === "0 0 1 * *") {
    return "On the 1st of every month at midnight";
  }

  // Build custom description
  if (parsed.min !== "*" && parsed.hour !== "*") {
    result += `At minute ${parsed.min} past hour ${parsed.hour}`;
  } else if (parsed.min !== "*") {
    result += `At minute ${parsed.min}`;
  } else if (parsed.hour !== "*") {
    result += `At hour ${parsed.hour}`;
  }

  if (parsed.dayOfMonth !== "*" && parsed.dayOfMonth !== "?") {
    result += `, on day ${parsed.dayOfMonth} of the month`;
  }

  if (parsed.month !== "*") {
    result += `, in ${translateField(parsed.month, "month")}`;
  }

  if (parsed.dayOfWeek !== "*" && parsed.dayOfWeek !== "?") {
    result += `, on ${translateField(parsed.dayOfWeek, "dayOfWeek")}`;
  }

  return result || "Invalid cron expression";
}

// Calculate next execution times
function getNextExecutions(cron: string, count: number = 5): Date[] {
  const parsed = parseCronExpression(cron);
  if (!parsed) return [];

  const executions: Date[] = [];
  let current = new Date();
  current.setSeconds(0, 0);

  const maxIterations = 1000; // Prevent infinite loops
  let iterations = 0;

  while (executions.length < count && iterations < maxIterations) {
    iterations++;
    current.setMinutes(current.getMinutes() + 1);

    const min = current.getMinutes();
    const hour = current.getHours();
    const dayOfMonth = current.getDate();
    const month = current.getMonth() + 1; // 1-12
    const dayOfWeek = current.getDay(); // 0-6

    if (matchesField(min.toString(), parsed.min) &&
        matchesField(hour.toString(), parsed.hour) &&
        matchesField(dayOfMonth.toString(), parsed.dayOfMonth) &&
        matchesField(month.toString(), parsed.month) &&
        matchesField(dayOfWeek.toString(), parsed.dayOfWeek)) {
      executions.push(new Date(current));
    }
  }

  return executions;
}

function matchesField(value: string, pattern: string): boolean {
  if (pattern === "*") return true;
  if (pattern === "?") return true;

  // Handle ranges
  if (pattern.includes("-")) {
    const [start, end] = pattern.split("-").map(Number);
    const numValue = parseInt(value);
    return numValue >= start && numValue <= end;
  }

  // Handle lists
  if (pattern.includes(",")) {
    return pattern.split(",").includes(value);
  }

  // Handle steps
  if (pattern.includes("/")) {
    const [base, step] = pattern.split("/");
    const stepNum = parseInt(step);
    const numValue = parseInt(value);
    
    if (base === "*") {
      return numValue % stepNum === 0;
    }
    
    const [start, end] = base.split("-").map(Number);
    if (!isNaN(start) && !isNaN(end)) {
      if (numValue < start || numValue > end) return false;
      return (numValue - start) % stepNum === 0;
    }
    
    return numValue % stepNum === 0;
  }

  return value === pattern;
}

export default function CronTool() {
  const [cronInput, setCronInput] = useState("0 */2 * * *");
  const [humanReadable, setHumanReadable] = useState<string | null>(null);
  const [nextExecutions, setNextExecutions] = useState<Date[]>([]);
  const [isValid, setIsValid] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".animate-fade-in"),
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
      );
    }
  }, []);

  // Auto-translate on input change
  useEffect(() => {
    if (!cronInput.trim()) {
      setHumanReadable(null);
      setNextExecutions([]);
      setIsValid(false);
      return;
    }

    const parsed = parseCronExpression(cronInput);
    setIsValid(parsed !== null);

    if (parsed) {
      const translation = translateCronToHuman(cronInput);
      setHumanReadable(translation);
      setNextExecutions(getNextExecutions(cronInput, 5));
    } else {
      setHumanReadable(null);
      setNextExecutions([]);
    }
  }, [cronInput]);

  const copyToClipboard = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  const clearInput = () => {
    setCronInput("");
  };

  const formatExecutionDate = (date: Date): string => {
    return date.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
            
            <CardHeader>
              <CardTitle className="text-zinc-50 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-400" />
                Cron Expression Translator
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Translate cron expressions into human-readable format and see upcoming execution times.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cron-input" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                  Cron Expression
                </Label>
                <Input
                  id="cron-input"
                  value={cronInput}
                  onChange={(e) => setCronInput(e.target.value)}
                  placeholder="0 */2 * * *"
                  className="bg-zinc-900/60 border-zinc-700 focus:border-orange-500/50 text-zinc-100 placeholder-zinc-600 font-mono text-sm"
                />
                {cronInput && (
                  <Button
                    variant="ghost"
                    onClick={clearInput}
                    className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 w-full text-xs h-8"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Clear
                  </Button>
                )}
              </div>

              {/* Validation Status */}
              {cronInput && (
                <div className="flex items-center gap-2">
                  {isValid ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Valid cron expression
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-rose-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Invalid cron format (expected 5 parts)
                    </span>
                  )}
                </div>
              )}

              {/* Format Info */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 space-y-2">
                <p className="text-[10px] text-zinc-500 uppercase font-semibold flex items-center gap-1.5">
                  <Info className="w-3 h-3 text-orange-400" /> Format
                </p>
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-zinc-400 font-semibold">Minute</p>
                    <p className="text-[10px] text-zinc-500">0-59</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-semibold">Hour</p>
                    <p className="text-[10px] text-zinc-500">0-23</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-semibold">Day</p>
                    <p className="text-[10px] text-zinc-500">1-31</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-semibold">Month</p>
                    <p className="text-[10px] text-zinc-500">1-12</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-semibold">Weekday</p>
                    <p className="text-[10px] text-zinc-500">0-6</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6">
          {/* Human Readable Output */}
          {humanReadable && (
            <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in">
              <CardHeader className="border-b border-zinc-900 pb-4">
                <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-orange-400" /> Human Readable
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl p-4 text-zinc-200 text-sm leading-relaxed">
                  {humanReadable}
                </div>
                <Button
                  onClick={() => copyToClipboard(humanReadable, "Description copied!")}
                  className="w-full bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold border-none py-5 flex items-center gap-1.5 justify-center cursor-pointer shadow-lg shadow-orange-500/10"
                >
                  <Copy className="w-4 h-4" /> Copy Description
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Next Executions */}
          {nextExecutions.length > 0 && (
            <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in">
              <CardHeader className="border-b border-zinc-900 pb-4">
                <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-orange-400" /> Next 5 Executions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {nextExecutions.map((date, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800"
                  >
                    <div className="w-6 h-6 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm text-zinc-300 font-mono">{formatExecutionDate(date)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {!isValid && cronInput && (
            <Card className="bg-rose-500/5 border-rose-500/20 backdrop-blur-xl animate-fade-in">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertCircle className="w-5 h-5" />
                  <p className="font-semibold text-sm">Invalid Cron Expression</p>
                </div>
                <p className="text-xs text-rose-300/80">
                  Please enter a valid 5-part cron expression (minute hour day month weekday).
                </p>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!cronInput && (
            <Card className="bg-zinc-950/40 border-zinc-800/60 backdrop-blur-xl">
              <CardContent className="p-6 space-y-3">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Examples</h4>
                <div className="space-y-2">
                  {[
                    { cron: "0 * * * *", desc: "Every hour" },
                    { cron: "0 0 * * *", desc: "Every day at midnight" },
                    { cron: "0 0 * * 0", desc: "Every Sunday at midnight" },
                    { cron: "0 0 1 * *", desc: "First day of every month" },
                    { cron: "*/5 * * * *", desc: "Every 5 minutes" },
                  ].map((example) => (
                    <button
                      key={example.cron}
                      onClick={() => setCronInput(example.cron)}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-zinc-900/40 border border-zinc-800 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all text-left"
                    >
                      <span className="text-xs text-zinc-400 font-mono">{example.cron}</span>
                      <span className="text-[10px] text-zinc-500">{example.desc}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}