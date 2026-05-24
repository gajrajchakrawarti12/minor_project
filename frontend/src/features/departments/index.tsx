import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, GraduationCap } from "lucide-react";
import { PageContainer } from "@/shared/components/PageContainer";
import { StatusAlerts } from "@/shared/components/StatusAlerts";
import { DepartmentPicker } from "@/shared/components/DepartmentPicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
  type Department,
} from "./api/departmentApi";
import { resolveApiErrorMessage } from "@/shared/lib/apiErrors";

type FormState = {
  name: string;
  abbreviation: string;
};

const initialFormState: FormState = {
  name: "",
  abbreviation: "",
};

function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedDepartment = useMemo(
    () => departments.find((d) => d.id === selectedDepartmentId) ?? null,
    [departments, selectedDepartmentId],
  );

  const loadDepartments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setDepartments(await listDepartments());
    } catch (err) {
      setError(resolveApiErrorMessage(err, "Failed to load departments."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDepartments();
  }, [loadDepartments]);

  const resetForm = () => {
    setFormState(initialFormState);
    setIsEditing(false);
  };

  const handleCreateMode = () => {
    setSelectedDepartmentId(null);
    resetForm();
    setError(null);
    setSuccessMessage(null);
  };

  const handleSelectDepartment = (department: Department) => {
    setSelectedDepartmentId(department.id);
    setFormState({ name: department.name, abbreviation: department.abbreviation });
    setIsEditing(true);
    setError(null);
    setSuccessMessage(null);
  };

  const validateForm = (): boolean => {
    if (!formState.name.trim()) {
      setError("Department name is required.");
      return false;
    }
    if (!formState.abbreviation.trim()) {
      setError("Department abbreviation is required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    if (!validateForm()) {
      return;
    }

    const payload = {
      name: formState.name.trim(),
      abbreviation: formState.abbreviation.trim(),
    };

    setIsSaving(true);
    try {
      if (isEditing && selectedDepartmentId !== null) {
        const updated = await updateDepartment(selectedDepartmentId, payload);
        setDepartments((current) =>
          current.map((department) => (department.id === updated.id ? updated : department)),
        );
        setSuccessMessage("Department updated successfully.");
      } else {
        const created = await createDepartment(payload);
        setDepartments((current) => [...current, created]);
        setSelectedDepartmentId(created.id);
        setIsEditing(true);
        setFormState({ name: created.name, abbreviation: created.abbreviation });
        setSuccessMessage("Department created successfully.");
      }
    } catch (err) {
      setError(resolveApiErrorMessage(err, "Failed to save department."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (selectedDepartmentId === null) {
      return;
    }
    if (!window.confirm("Delete this department? Related data may be affected.")) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    try {
      await deleteDepartment(selectedDepartmentId);
      setDepartments((current) => current.filter((d) => d.id !== selectedDepartmentId));
      setSelectedDepartmentId(null);
      resetForm();
      setSuccessMessage("Department deleted.");
    } catch (err) {
      setError(resolveApiErrorMessage(err, "Failed to delete department."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageContainer
      title="Departments"
      description="Manage academic departments"
      action={
        <Button onClick={handleCreateMode} className="gap-2">
          <Plus className="h-4 w-4" />
          New Department
        </Button>
      }
    >
      <StatusAlerts error={error} successMessage={successMessage} />

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-3">
          <DepartmentPicker
            departments={departments}
            selectedDepartmentId={selectedDepartmentId}
            isLoading={isLoading}
            onSelect={handleSelectDepartment}
          />
        </div>

        <div className="xl:col-span-9">
          {selectedDepartment ? (
            <>
              <div className="mb-6 flex flex-wrap gap-3">
                <Button asChild variant="outline" className="gap-2">
                  <Link to={`/teachers?departmentId=${selectedDepartment.id}`}>
                    <Users className="h-4 w-4" />
                    Manage teachers
                  </Link>
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <Link to={`/batches?departmentId=${selectedDepartment.id}`}>
                    <GraduationCap className="h-4 w-4" />
                    Manage batches
                  </Link>
                </Button>
              </div>

              <Tabs defaultValue="edit" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="delete">Delete</TabsTrigger>
                </TabsList>

                <TabsContent value="edit" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Edit {selectedDepartment.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Department name</label>
                          <Input
                            value={formState.name}
                            onChange={(e) =>
                              setFormState((c) => ({ ...c, name: e.target.value }))
                            }
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
                        <Button type="submit" disabled={isSaving}>
                          {isSaving ? "Saving..." : "Update department"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="delete" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Delete {selectedDepartment.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => void handleDelete()}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Deleting..." : "Delete department"}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Add new department</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Department name</label>
                    <Input
                      value={formState.name}
                      onChange={(e) => setFormState((c) => ({ ...c, name: e.target.value }))}
                      placeholder="e.g., Computer Science"
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
                      placeholder="e.g., CS"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Create department"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

export default DepartmentsPage;
