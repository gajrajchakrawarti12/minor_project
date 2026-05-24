import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { Department } from "@/features/departments/api/departmentApi";

type DepartmentPickerProps = {
  departments: Department[];
  selectedDepartmentId: number | null;
  isLoading: boolean;
  onSelect: (department: Department) => void;
};

export function DepartmentPicker({
  departments,
  selectedDepartmentId,
  isLoading,
  onSelect,
}: DepartmentPickerProps) {
  return (
    <Card className="xl:sticky xl:top-[6rem]">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Departments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 overflow-y-auto">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading departments...</div>
        ) : departments.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No departments yet</div>
        ) : (
          departments.map((dept) => (
            <button
              key={dept.id}
              type="button"
              onClick={() => onSelect(dept)}
              className={`w-full rounded-lg border-2 p-3 text-left transition-all duration-200 ${
                selectedDepartmentId === dept.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-accent"
              }`}
            >
              <div className="font-semibold text-foreground">{dept.name}</div>
              <div className="text-xs text-muted-foreground">{dept.abbreviation}</div>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default DepartmentPicker;
