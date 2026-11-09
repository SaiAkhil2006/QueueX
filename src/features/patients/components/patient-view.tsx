"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Patient, CreatePatientInput, PatientWithHistory } from "../types";
import {
  fetchPatients,
  fetchPatientById,
  createPatientClient,
  updatePatientClient,
} from "../services/patients.client";
import { PatientDialog } from "./patient-dialog";
import { PatientProfileDialog } from "./patient-profile-dialog";
import {
  Search,
  UserPlus,
  RefreshCw,
  Users,
  Eye,
  Edit2,
  Calendar,
  AlertCircle,
  Activity,
  Heart,
} from "lucide-react";

interface PatientViewProps {
  hospitalId: string;
  onNavigateToBooking?: (patientId: string) => void;
}

export function PatientView({ hospitalId, onNavigateToBooking }: PatientViewProps) {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Profile modal states
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState<PatientWithHistory | null>(null);

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPatients(hospitalId, {
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        gender: genderFilter !== "all" ? genderFilter : undefined,
      });
      setPatients(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load patients");
    } finally {
      setLoading(false);
    }
  }, [hospitalId, searchTerm, statusFilter, genderFilter]);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPatients(hospitalId, {
          search: searchTerm || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          gender: genderFilter !== "all" ? genderFilter : undefined,
        });
        if (active) setPatients(data);
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load patients");
      } finally {
        if (active) setLoading(false);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [hospitalId, statusFilter, genderFilter, searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPatients();
  };

  const handleOpenCreate = () => {
    setSelectedPatient(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleOpenEdit = (p: Patient) => {
    setSelectedPatient(p);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleViewProfile = async (p: Patient) => {
    try {
      setProfileOpen(true);
      const fullProfile = await fetchPatientById(hospitalId, p.id);
      setProfileData(fullProfile);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const handleSavePatient = async (data: Partial<CreatePatientInput>) => {
    if (dialogMode === "create") {
      await createPatientClient(hospitalId, data as CreatePatientInput);
    } else if (selectedPatient) {
      await updatePatientClient(hospitalId, selectedPatient.id, data);
    }
    await loadPatients();
  };

  const totalPatients = patients.length;
  const activePatients = patients.filter((p) => p.status === "active").length;
  const femaleCount = patients.filter((p) => p.gender === "female").length;
  const maleCount = patients.filter((p) => p.gender === "male").length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Patient Registry & Universal Health IDs
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Centralized OPD intake, UHID issuance, medical visit timeline, and emergency records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPatients}
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-9 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
          >
            <UserPlus className="h-4 w-4" />
            Register Patient
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">Registered Patients</div>
              <div className="text-2xl font-bold text-foreground">{totalPatients}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">Active Status</div>
              <div className="text-2xl font-bold text-emerald-600">{activePatients}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">Male / Female</div>
              <div className="text-xl font-bold text-foreground">
                {maleCount} <span className="text-muted-foreground font-normal text-sm">/</span> {femaleCount}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">UHID Standard</div>
              <div className="text-sm font-bold font-mono text-foreground">QX-2026-XXXX</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by UHID, patient name, or phone number..."
                  className="pl-9 h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary" size="sm" className="h-9">
                Search
              </Button>
            </form>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Gender Filter */}
              <select
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
              >
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>

              {/* Status Filter */}
              <select
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Patients Data Table */}
      <Card className="shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="py-3 px-4 font-semibold">UHID</th>
                <th className="py-3 px-4 font-semibold">Patient Name</th>
                <th className="py-3 px-4 font-semibold">Age / Gender</th>
                <th className="py-3 px-4 font-semibold">Contact Phone</th>
                <th className="py-3 px-4 font-semibold">Blood Group</th>
                <th className="py-3 px-4 font-semibold">Emergency Contact</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-36" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-3 px-4 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="font-medium">No patient records found.</p>
                    <p className="text-xs mt-1">Try adjusting search filters or register a new patient.</p>
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-xs text-foreground">
                      <span className="px-2 py-0.5 rounded bg-muted border border-border">
                        {p.uhid}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      <button
                        onClick={() => handleViewProfile(p)}
                        className="hover:text-teal-600 hover:underline text-left cursor-pointer"
                      >
                        {p.name}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs capitalize">
                      {p.age} yrs • {p.gender}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs font-mono">
                      {p.phone}
                    </td>
                    <td className="py-3 px-4">
                      {p.bloodGroup ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          {p.bloodGroup}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {p.emergencyContact ? (
                        <span>
                          {p.emergencyContact.name} ({p.emergencyContact.relation})
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60 italic">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          p.status === "active"
                            ? "default"
                            : p.status === "inactive"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-[11px] capitalize"
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewProfile(p)}
                          className="h-8 px-2 text-xs"
                          title="View Profile & History"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(p)}
                          className="h-8 px-2 text-xs"
                          title="Edit Patient"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Patient Register/Edit Dialog */}
      <PatientDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSavePatient}
        patient={selectedPatient}
        mode={dialogMode}
      />

      {/* Patient Profile & Visit Timeline Dialog */}
      <PatientProfileDialog
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        patient={profileData}
        onBookAppointment={(pat) => {
          if (onNavigateToBooking) {
            onNavigateToBooking(pat.id);
          } else {
            router.push(`/appointments?patientId=${pat.id}`);
          }
        }}
      />
    </div>
  );
}
