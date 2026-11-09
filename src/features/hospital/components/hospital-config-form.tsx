"use client";

import React, { useState } from "react";
import type { SerializedHospital, HospitalFormValues } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Building2,
  Clock,
  ShieldAlert,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Globe,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import type { HospitalStatus } from "@/types/hospital";
import { toDate } from "@/lib/firebase/timestamps";

const DAYS_OF_WEEK = [
  { day: 1, label: "Mon" },
  { day: 2, label: "Tue" },
  { day: 3, label: "Wed" },
  { day: 4, label: "Thu" },
  { day: 5, label: "Fri" },
  { day: 6, label: "Sat" },
  { day: 0, label: "Sun" },
];

interface HospitalConfigFormProps {
  hospital: SerializedHospital;
  onSave: (values: Partial<HospitalFormValues>) => Promise<void>;
  isSaving: boolean;
}

export function HospitalConfigForm({
  hospital,
  onSave,
  isSaving,
}: HospitalConfigFormProps) {
  // Initialize form state from props
  const [formData, setFormData] = useState<HospitalFormValues>({
    name: hospital.name,
    code: hospital.code,
    description: hospital.description || "",
    address: hospital.address,
    city: hospital.city,
    state: hospital.state,
    postalCode: hospital.postalCode,
    phone: hospital.phone,
    email: hospital.email,
    status: hospital.status,
    timezone: hospital.timezone,
    opdMorningStartTime: hospital.configuration.opdMorningStartTime,
    opdMorningEndTime: hospital.configuration.opdMorningEndTime,
    opdEveningStartTime: hospital.configuration.opdEveningStartTime,
    opdEveningEndTime: hospital.configuration.opdEveningEndTime,
    emergencyWaitThresholdMinutes:
      hospital.configuration.emergencyWaitThresholdMinutes,
    maxActiveQueuesPerDoctor: hospital.configuration.maxActiveQueuesPerDoctor,
    autoCallNextEnabled: hospital.configuration.autoCallNextEnabled,
    operatingDays: hospital.configuration.operatingDays ?? [1, 2, 3, 4, 5, 6],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Hospital name is required";
    if (!formData.code.trim() || formData.code.length < 2)
      newErrors.code = "Code must be at least 2 characters";
    if (!formData.phone.trim() || formData.phone.length < 7)
      newErrors.phone = "Valid phone number is required";
    if (!formData.email.trim() || !formData.email.includes("@"))
      newErrors.email = "Valid email address is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.postalCode.trim()) newErrors.postalCode = "Postal code is required";

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(formData.opdMorningStartTime))
      newErrors.opdMorningStartTime = "Must be in HH:MM format";
    if (!timeRegex.test(formData.opdMorningEndTime))
      newErrors.opdMorningEndTime = "Must be in HH:MM format";
    if (!timeRegex.test(formData.opdEveningStartTime))
      newErrors.opdEveningStartTime = "Must be in HH:MM format";
    if (!timeRegex.test(formData.opdEveningEndTime))
      newErrors.opdEveningEndTime = "Must be in HH:MM format";

    if (
      isNaN(formData.emergencyWaitThresholdMinutes) ||
      formData.emergencyWaitThresholdMinutes <= 0
    ) {
      newErrors.emergencyWaitThresholdMinutes =
        "Threshold must be a positive integer";
    }

    if (formData.operatingDays.length === 0) {
      newErrors.operatingDays = "Select at least one operating day";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);

    if (!validate()) {
      return;
    }

    try {
      await onSave(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch {
      // Error is handled upstream in view
    }
  };

  const handleReset = () => {
    setFormData({
      name: hospital.name,
      code: hospital.code,
      description: hospital.description || "",
      address: hospital.address,
      city: hospital.city,
      state: hospital.state,
      postalCode: hospital.postalCode,
      phone: hospital.phone,
      email: hospital.email,
      status: hospital.status,
      timezone: hospital.timezone,
      opdMorningStartTime: hospital.configuration.opdMorningStartTime,
      opdMorningEndTime: hospital.configuration.opdMorningEndTime,
      opdEveningStartTime: hospital.configuration.opdEveningStartTime,
      opdEveningEndTime: hospital.configuration.opdEveningEndTime,
      emergencyWaitThresholdMinutes:
        hospital.configuration.emergencyWaitThresholdMinutes,
      maxActiveQueuesPerDoctor: hospital.configuration.maxActiveQueuesPerDoctor,
      autoCallNextEnabled: hospital.configuration.autoCallNextEnabled,
      operatingDays: hospital.configuration.operatingDays ?? [1, 2, 3, 4, 5, 6],
    });
    setErrors({});
    setSaveSuccess(false);
  };

  const toggleDay = (day: number) => {
    setFormData((prev) => {
      const exists = prev.operatingDays.includes(day);
      const updated = exists
        ? prev.operatingDays.filter((d) => d !== day)
        : [...prev.operatingDays, day].sort();
      return { ...prev, operatingDays: updated };
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Banner Notifications */}
      {saveSuccess && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="size-5 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Configuration saved!</span> Hospital
            operational parameters have been persisted to Firestore.
          </div>
        </div>
      )}

      {Object.keys(errors).length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <AlertTriangle className="size-5 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Validation Error:</span> Please check
            the highlighted fields below before submitting.
          </div>
        </div>
      )}

      {/* Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {hospital.name}
            </h2>
            <Badge
              variant={
                hospital.status === "active"
                  ? "default"
                  : hospital.status === "maintenance"
                  ? "secondary"
                  : "outline"
              }
              className="capitalize"
            >
              {hospital.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Operational configuration and institutional metadata
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isSaving}
          >
            <RotateCcw className="size-4" />
            Reset
          </Button>
          <Button type="submit" size="sm" disabled={isSaving}>
            <Save className="size-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Basic Info & Operating Hours (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Section 1: Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <Building2 className="size-5" />
                <CardTitle className="text-base">Basic Information</CardTitle>
              </div>
              <CardDescription>
                Institutional identity, public contact lines, and geographic location.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="name">Hospital Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    error={Boolean(errors.name)}
                    placeholder="e.g. Visakha Multispeciality Hospital"
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="code">Hospital Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    error={Boolean(errors.code)}
                    placeholder="e.g. VMH"
                    maxLength={10}
                  />
                  {errors.code && (
                    <p className="text-xs text-destructive">{errors.code}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="description">Hospital Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Summary of hospital specialty services and outpatient care units..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      error={Boolean(errors.phone)}
                      placeholder="+91 891 278 9000"
                    />
                    <Phone className="pointer-events-none absolute right-3 top-2.5 size-4 text-muted-foreground" />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      error={Boolean(errors.email)}
                      placeholder="info@visakhahospital.org"
                    />
                    <Mail className="pointer-events-none absolute right-3 top-2.5 size-4 text-muted-foreground" />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="address">Address *</Label>
                <div className="relative">
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    error={Boolean(errors.address)}
                    placeholder="Street, locality, plot number"
                  />
                  <MapPin className="pointer-events-none absolute right-3 top-2.5 size-4 text-muted-foreground" />
                </div>
                {errors.address && (
                  <p className="text-xs text-destructive">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    error={Boolean(errors.city)}
                  />
                  {errors.city && (
                    <p className="text-xs text-destructive">{errors.city}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="postalCode">Postal Code *</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) =>
                      setFormData({ ...formData, postalCode: e.target.value })
                    }
                    error={Boolean(errors.postalCode)}
                  />
                  {errors.postalCode && (
                    <p className="text-xs text-destructive">
                      {errors.postalCode}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Operational Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <Clock className="size-5" />
                <CardTitle className="text-base">
                  Operational Configuration
                </CardTitle>
              </div>
              <CardDescription>
                OPD clinic shifts, operating week schedule, and escalation parameters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Operating Days */}
              <div className="space-y-2">
                <Label>Operating Days *</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((item) => {
                    const isSelected = formData.operatingDays.includes(item.day);
                    return (
                      <button
                        key={item.day}
                        type="button"
                        onClick={() => toggleDay(item.day)}
                        className={`flex h-8 w-11 items-center justify-center rounded-md border text-xs font-semibold transition-colors ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-xs"
                            : "border-input bg-background text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                {errors.operatingDays && (
                  <p className="text-xs text-destructive">
                    {errors.operatingDays}
                  </p>
                )}
              </div>

              {/* Shifts */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-3 rounded-lg border p-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Morning OPD Shift
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="opdMorningStartTime" className="text-xs">
                        Start Time
                      </Label>
                      <Input
                        id="opdMorningStartTime"
                        value={formData.opdMorningStartTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            opdMorningStartTime: e.target.value,
                          })
                        }
                        error={Boolean(errors.opdMorningStartTime)}
                        placeholder="08:30"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="opdMorningEndTime" className="text-xs">
                        End Time
                      </Label>
                      <Input
                        id="opdMorningEndTime"
                        value={formData.opdMorningEndTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            opdMorningEndTime: e.target.value,
                          })
                        }
                        error={Boolean(errors.opdMorningEndTime)}
                        placeholder="13:30"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border p-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Evening OPD Shift
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="opdEveningStartTime" className="text-xs">
                        Start Time
                      </Label>
                      <Input
                        id="opdEveningStartTime"
                        value={formData.opdEveningStartTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            opdEveningStartTime: e.target.value,
                          })
                        }
                        error={Boolean(errors.opdEveningStartTime)}
                        placeholder="16:00"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="opdEveningEndTime" className="text-xs">
                        End Time
                      </Label>
                      <Input
                        id="opdEveningEndTime"
                        value={formData.opdEveningEndTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            opdEveningEndTime: e.target.value,
                          })
                        }
                        error={Boolean(errors.opdEveningEndTime)}
                        placeholder="20:00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Threshold & Status */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="emergencyWaitThresholdMinutes">
                    Emergency Wait Escalation (Minutes) *
                  </Label>
                  <div className="relative">
                    <Input
                      id="emergencyWaitThresholdMinutes"
                      type="number"
                      min={1}
                      max={120}
                      value={formData.emergencyWaitThresholdMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergencyWaitThresholdMinutes: parseInt(
                            e.target.value,
                            10
                          ),
                        })
                      }
                      error={Boolean(errors.emergencyWaitThresholdMinutes)}
                    />
                    <ShieldAlert className="pointer-events-none absolute right-3 top-2.5 size-4 text-muted-foreground" />
                  </div>
                  {errors.emergencyWaitThresholdMinutes && (
                    <p className="text-xs text-destructive">
                      {errors.emergencyWaitThresholdMinutes}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="status">Operational Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as HospitalStatus,
                      })
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="active">Active (Full OPD Operations)</option>
                    <option value="maintenance">Maintenance (Limited Services)</option>
                    <option value="inactive">Inactive (Closed)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: System Info & Settings (1 col) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <Info className="size-5" />
                <CardTitle className="text-base">System Information</CardTitle>
              </div>
              <CardDescription>
                Internal Firestore identifiers and audit timestamps.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Hospital ID:</span>
                <span className="font-mono font-medium text-foreground">
                  {hospital.id}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Timezone:</span>
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Globe className="size-3 text-muted-foreground" />
                  {hospital.timezone}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Created Date:</span>
                <span className="text-foreground">
                  {toDate(hospital.createdAt)?.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }) || "—"}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="text-foreground">
                  {toDate(hospital.updatedAt)?.toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }) || "—"}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Firestore Path:</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  /hospitals/{hospital.id}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-primary">
                Multi-Tenant Architecture
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              QueueX partitions all operational data—departments, doctors,
              appointments, and live queues—scoped under this hospital document.
              Changing default shift hours here establishes the operating window
              for upcoming session creation.
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
