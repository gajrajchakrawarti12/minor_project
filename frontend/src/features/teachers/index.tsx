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
  createTeacher,
  deleteTeacher,
  listTeachers,
  updateTeacher,
  type Teacher,
} from "@/features/teachers/api/teacherApi";
import { resolveApiErrorMessage } from "@/shared/lib/apiErrors";

type TeacherFormState = {
  name: string;
  abbreviation: string;
  specializationIds: number[];
};

const initialTeacherForm: TeacherFormState = {
  name: "",
  abbreviation: "",
  specializationIds: [],
};

function TeachersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [formState, setFormState] = useState<TeacherFormState>(initialTeacherForm);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingTeacherId, setDeletingTeacherId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedDepartment = useMemo(
    () => departments.find((d) => d.id === selectedDepartmentId) ?? null,
    [departments, selectedDepartmentId],
  );

  const teachersInDepartment = useMemo(
    () => teachers.filter((t) => t.departmentId === selectedDepartmentId),
    [teachers, selectedDepartmentId],
  );

  const filteredTeachers = useMemo(() => {
    const query = teacherSearchQuery.trim().toLowerCase();
    if (!query) {
      return teachersInDepartment;
    }
    return teachersInDepartment.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.abbreviation.toLowerCase().includes(query),
    );
  }, [teachersInDepartment, teacherSearchQuery]);

  const subjectNameById = useMemo(
    () => new Map(subjects.map((s) => [s.id, s.name])),
    [subjects],
  );

  const selectedSpecializationNames = useMemo(
    () =>
      formState.specializationIds
        .map((id) => subjectNameById.get(id))
        .filter((name): name is string => Boolean(name)),
    [formState.specializationIds, subjectNameById],
  );

  const loadTeachers = useCallback(async () => {
    setIsLoadingTeachers(true);
    try {
      setTeachers(await listTeachers());
    } catch (err) {
      setError(resolveApiErrorMessage(err, "Failed to load teachers."));
    } finally {
      setIsLoadingTeachers(false);
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
    void loadTeachers();
  }, [loadTeachers]);

  const resetForm = () => {
    setFormState(initialTeacherForm);
    setSelectedTeacherId(null);
    setIsEditing(false);
  };

  const selectDepartment = (department: Department) => {
    setSelectedDepartmentId(department.id);
    setSearchParams({ departmentId: String(department.id) });
    resetForm();
    setError(null);
    setSuccessMessage(null);
  };

  const selectTeacher = (teacher: Teacher) => {
    setSelectedTeacherId(teacher.id);
    setFormState({
      name: teacher.name,
      abbreviation: teacher.abbreviation,
      specializationIds: teacher.specializationIds,
    });
    setIsEditing(true);
    setError(null);
    setSuccessMessage(null);
  };

  const validateForm = (): boolean => {
    if (!formState.name.trim()) {
      setError("Teacher name is required.");
      return false;
    }
    if (!formState.abbreviation.trim()) {
      setError("Teacher abbreviation is required.");
      return false;
    }
    if (formState.specializationIds.length === 0) {
      setError("At least one specialization subject is required.");
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
      abbreviation: formState.abbreviation.trim(),
      specializationIds: formState.specializationIds,
      departmentId: selectedDepartmentId,
    };

    setIsSaving(true);
    try {
      if (isEditing && selectedTeacherId !== null) {
        const updated = await updateTeacher(selectedTeacherId, payload);
        setTeachers((current) => current.map((t) => (t.id === updated.id ? updated : t)));
        setSuccessMessage("Teacher updated successfully.");
      } else {
        const created = await createTeacher(payload);
        setTeachers((current) => [created, ...current]);
        selectTeacher(created);
        setSuccessMessage("Teacher created successfully.");
      }
    } catch (err) {
      setError(resolveApiErrorMessage(err, "Failed to save teacher."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (teacherId: number) => {
    if (!window.confirm("Delete this teacher?")) {
      return;
    }
    setDeletingTeacherId(teacherId);
    setError(null);
    try {
      await deleteTeacher(teacherId);
      setTeachers((current) => current.filter((t) => t.id !== teacherId));
      setSuccessMessage("Teacher deleted.");
      if (selectedTeacherId === teacherId) {
        resetForm();
      }
    } catch (err) {
      setError(resolveApiErrorMessage(err, "Failed to delete teacher."));
    } finally {
      setDeletingTeacherId(null);
    }
  };

  return (
    <PageContainer
      title="Teachers"
      description="Manage faculty and their subject specializations"
      action={
        selectedDepartment ? (
          <Button
            type="button"
            className="gap-2"
            onClick={() => {
              resetForm();
              setError(null);
              setSuccessMessage(null);
            }}
          >
            <Plus className="h-4 w-4" />
            New Teacher
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
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                      <CardTitle className="text-lg">Faculty</CardTitle>
                      <p className="text-sm text-muted-foreground">{selectedDepartment.name}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      placeholder="Search teachers..."
                      value={teacherSearchQuery}
                      onChange={(e) => setTeacherSearchQuery(e.target.value)}
                    />
                    {isLoadingTeachers ? (
                      <p className="text-sm text-muted-foreground">Loading teachers...</p>
                    ) : filteredTeachers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No teachers in this department.</p>
                    ) : (
                      filteredTeachers.map((teacher) => (
                        <div
                          key={teacher.id}
                          className={`flex justify-between gap-2 rounded-lg border p-3 cursor-pointer ${
                            selectedTeacherId === teacher.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:bg-accent/50"
                          }`}
                          onClick={() => selectTeacher(teacher)}
                        >
                          <div>
                            <p className="font-medium">{teacher.name}</p>
                            <p className="text-xs text-muted-foreground">{teacher.abbreviation}</p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDelete(teacher.id);
                            }}
                            disabled={deletingTeacherId !== null}
                          >
                            {deletingTeacherId === teacher.id ? "..." : "Delete"}
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="xl:col-span-7 xl:sticky xl:top-[6rem]">
                  <CardHeader>
                    <CardTitle>{isEditing ? "Edit Teacher" : "Add Teacher"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input
                          value={formState.name}
                          onChange={(e) => setFormState((c) => ({ ...c, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Abbreviation</label>
                        <Input
                          value={formState.abbreviation}
                          onChange={(e) =>
                            setFormState((c) => ({ ...c, abbreviation: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Specializations</label>
                        <select
                          multiple
                          className="h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={formState.specializationIds.map(String)}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions).map((o) =>
                              Number(o.value),
                            );
                            setFormState((c) => ({ ...c, specializationIds: selected }));
                          }}
                        >
                          {subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name}
                            </option>
                          ))}
                        </select>
                        {selectedSpecializationNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {selectedSpecializationNames.map((name) => (
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
              <p className="text-muted-foreground">Select a department to manage teachers.</p>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default TeachersPage;
