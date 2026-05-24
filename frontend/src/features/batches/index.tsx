import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { PageContainer } from "@/shared/components/PageContainer";
import { StatusAlerts } from "@/shared/components/StatusAlerts";
import { DepartmentPicker } from "@/shared/components/DepartmentPicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { listDepartments, type Department } from "@/features/departments/api/departmentApi";
import { listSubjects, type Subject } from "@/features/subjects/api/subjectApi";
import {
  createBatch,
  deleteBatch,
  listBatches,
  updateBatch,
  type Batch,
} from "@/features/batches/api/batchApi";
import { resolveApiErrorMessage } from "@/shared/lib/apiErrors";

type BatchFormState = {
  name: string;
  semester: string;
  subjectIds: number[];
};

const initialBatchForm: BatchFormState = {
  name: "",
  semester: "",
  subjectIds: [],
};

function BatchesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [formState, setFormState] = useState<BatchFormState>(initialBatchForm);
  const [batchSearchQuery, setBatchSearchQuery] = useState("");
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingBatchId, setDeletingBatchId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedDepartment = useMemo(
    () => departments.find((d) => d.id === selectedDepartmentId) ?? null,
    [departments, selectedDepartmentId],
  );

  const batchesInDepartment = useMemo(
    () => batches.filter((b) => b.department_id === selectedDepartmentId),
    [batches, selectedDepartmentId],
  );

  const filteredBatches = useMemo(() => {
    const query = batchSearchQuery.trim().toLowerCase();
    if (!query) {
      return batchesInDepartment;
    }
    return batchesInDepartment.filter((b) => b.name.toLowerCase().includes(query));
  }, [batchesInDepartment, batchSearchQuery]);

  const subjectNameById = useMemo(
    () => new Map(subjects.map((s) => [s.id, s.name])),
    [subjects],
  );

  const selectedSubjectNames = useMemo(
    () =>
      formState.subjectIds
        .map((id) => subjectNameById.get(id))
        .filter((name): name is string => Boolean(name)),
    [formState.subjectIds, subjectNameById],
  );

  const loadBatches = useCallback(async () => {
    setIsLoadingBatches(true);
    try {
      setBatches(await listBatches());
    } catch (err) {
      setError(resolveApiErrorMessage(err, "Failed to load batches."));
    } finally {
      setIsLoadingBatches(false);
    }
  }, []);

  const loadInitial = useCallback(async () => {
    setIsLoadingDepartments(true);
    setError(null);
    try {
      const [deptResponse, subjectResponse] = await Promise.all([
        listDepartments(),
        listSubjects(),
      ]);
      setDepartments(deptResponse);
      setSubjects(subjectResponse);

      const paramId = searchParams.get("departmentId");
      const parsed = paramId ? Number(paramId) : NaN;
      const initialId =
        Number.isInteger(parsed) && parsed > 0 && deptResponse.some((d) => d.id === parsed)
          ? parsed
          : deptResponse[0]?.id ?? null;
      setSelectedDepartmentId(initialId);
    } catch (err) {
      setError(resolveApiErrorMessage(err, "Failed to load departments."));
    } finally {
      setIsLoadingDepartments(false);
    }
  }, [searchParams]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  const resetForm = () => {
    setFormState(initialBatchForm);
    setSelectedBatchId(null);
    setIsEditing(false);
  };

  const selectDepartment = (department: Department) => {
    setSelectedDepartmentId(department.id);
    setSearchParams({ departmentId: String(department.id) });
    resetForm();
    setError(null);
    setSuccessMessage(null);
  };

  const selectBatch = (batch: Batch) => {
    setSelectedBatchId(batch.id);
    setFormState({
      name: batch.name,
      semester: String(batch.semester),
      subjectIds: batch.subject_ids,
    });
    setIsEditing(true);
    setError(null);
    setSuccessMessage(null);
  };

  const validateForm = (): boolean => {
    if (!formState.name.trim()) {
      setError("Batch name is required.");
      return false;
    }
    const semester = Number(formState.semester);
    if (!Number.isInteger(semester) || semester < 1) {
      setError("Semester must be a positive integer.");
      return false;
    }
    if (!selectedDepartmentId) {
      setError("Select a department first.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    if (!validateForm() || !selectedDepartmentId) {
      return;
    }

    const payload = {
      name: formState.name.trim(),
      semester: Number(formState.semester),
      department_id: selectedDepartmentId,
      subject_ids: formState.subjectIds,
    };

    setIsSaving(true);
    try {
      if (isEditing && selectedBatchId !== null) {
        const updated = await updateBatch(selectedBatchId, payload);
        setBatches((current) => current.map((b) => (b.id === updated.id ? updated : b)));
        setSuccessMessage("Batch updated successfully.");
      } else {
        const created = await createBatch(payload);
        setBatches((current) => [created, ...current]);
        selectBatch(created);
        setSuccessMessage("Batch created successfully.");
      }
    } catch (err) {
      setError(resolveApiErrorMessage(err, "Failed to save batch."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (batchId: number) => {
    if (!window.confirm("Delete this batch?")) {
      return;
    }
    setDeletingBatchId(batchId);
    setError(null);
    try {
      await deleteBatch(batchId);
      setBatches((current) => current.filter((b) => b.id !== batchId));
      setSuccessMessage("Batch deleted.");
      if (selectedBatchId === batchId) {
        resetForm();
      }
    } catch (err) {
      setError(resolveApiErrorMessage(err, "Failed to delete batch."));
    } finally {
      setDeletingBatchId(null);
    }
  };

  return (
    <PageContainer
      title="Batches"
      description="Manage student batches and their subjects per department"
      action={
        selectedDepartment ? (
          <Button type="button" className="gap-2" onClick={resetForm}>
            <Plus className="h-4 w-4" />
            New Batch
          </Button>
        ) : null
      }
    >
      <StatusAlerts error={error} successMessage={successMessage} />

      {departments.length === 0 && !isLoadingDepartments ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Create a department first on the{" "}
            <Link to="/departments" className="text-primary underline">
              Departments
            </Link>{" "}
            page.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-3">
            <DepartmentPicker
              departments={departments}
              selectedDepartmentId={selectedDepartmentId}
              isLoading={isLoadingDepartments}
              onSelect={selectDepartment}
            />
          </div>

          <div className="xl:col-span-9">
            {selectedDepartment ? (
              <div className="grid gap-6 xl:grid-cols-12">
                <Card className="xl:col-span-5">
                  <CardHeader>
                    <CardTitle className="text-lg">Batches</CardTitle>
                    <p className="text-sm text-muted-foreground">{selectedDepartment.name}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      placeholder="Search batches..."
                      value={batchSearchQuery}
                      onChange={(e) => setBatchSearchQuery(e.target.value)}
                    />
                    {isLoadingBatches ? (
                      <p className="text-sm text-muted-foreground">Loading batches...</p>
                    ) : filteredBatches.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No batches in this department.</p>
                    ) : (
                      filteredBatches.map((batch) => (
                        <div
                          key={batch.id}
                          className={`flex justify-between gap-2 rounded-lg border p-3 cursor-pointer ${
                            selectedBatchId === batch.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:bg-accent/50"
                          }`}
                          onClick={() => selectBatch(batch)}
                        >
                          <div>
                            <p className="font-medium">{batch.name}</p>
                            <p className="text-xs text-muted-foreground">Semester {batch.semester}</p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDelete(batch.id);
                            }}
                            disabled={deletingBatchId !== null}
                          >
                            {deletingBatchId === batch.id ? "..." : "Delete"}
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="xl:col-span-7 xl:sticky xl:top-[6rem]">
                  <CardHeader>
                    <CardTitle>{isEditing ? "Edit Batch" : "Add Batch"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Batch name</label>
                        <Input
                          value={formState.name}
                          onChange={(e) => setFormState((c) => ({ ...c, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Semester</label>
                        <Input
                          type="number"
                          min={1}
                          value={formState.semester}
                          onChange={(e) =>
                            setFormState((c) => ({ ...c, semester: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Subjects</label>
                        <select
                          multiple
                          className="h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={formState.subjectIds.map(String)}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions).map((o) =>
                              Number(o.value),
                            );
                            setFormState((c) => ({ ...c, subjectIds: selected }));
                          }}
                        >
                          {subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name}
                            </option>
                          ))}
                        </select>
                        {selectedSubjectNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {selectedSubjectNames.map((name) => (
                              <span
                                key={name}
                                className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <Input value={selectedDepartment.name} readOnly aria-label="Department" />
                      <div className="flex gap-2">
                        <Button type="submit" disabled={isSaving} className="flex-1">
                          {isSaving ? "Saving..." : isEditing ? "Update" : "Add"}
                        </Button>
                        {isEditing ? (
                          <Button type="button" variant="outline" onClick={resetForm}>
                            Cancel
                          </Button>
                        ) : null}
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <p className="text-muted-foreground">Select a department to manage batches.</p>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default BatchesPage;
