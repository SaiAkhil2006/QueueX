"use client";

import React, { useEffect, useState, useCallback } from "react";
import type { SerializedHospital, HospitalFormValues } from "../types";
import { fetchHospital, updateHospital } from "../services/hospital.client";
import { HospitalConfigForm } from "./hospital-config-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, RefreshCw, Hospital as HospitalIcon } from "lucide-react";

interface HospitalViewProps {
  hospitalId?: string;
}

export function HospitalView({ hospitalId = "hosp-vzg-001" }: HospitalViewProps) {
  const [hospital, setHospital] = useState<SerializedHospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const data = await fetchHospital(hospitalId);
        if (!ignore) {
          setHospital(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load hospital configuration"
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    init();
    return () => {
      ignore = true;
    };
  }, [hospitalId]);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchHospital(hospitalId)
      .then((data) => {
        setHospital(data);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load hospital configuration"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [hospitalId]);

  const handleSave = async (formValues: Partial<HospitalFormValues>) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const updated = await updateHospital(hospitalId, formValues);
      setHospital(updated);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save hospital configuration";
      setSaveError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <Skeleton className="h-5 w-40" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 pt-6">
                <Skeleton className="h-5 w-40" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardContent className="space-y-4 pt-6">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !hospital) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-foreground">
          Unable to Load Hospital Configuration
        </h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {error || "Hospital document could not be found in Firestore."}
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Button onClick={handleRetry} variant="outline" size="sm">
            <RefreshCw className="size-4" />
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <HospitalIcon className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Hospital Configuration
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage institutional profile, default OPD shifts, emergency thresholds, and operating parameters.
          </p>
        </div>
      </div>

      {saveError && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="size-5 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Save failed:</span> {saveError}
          </div>
        </div>
      )}

      <HospitalConfigForm
        hospital={hospital}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
