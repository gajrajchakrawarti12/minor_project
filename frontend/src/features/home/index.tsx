import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  Clock,
  DoorOpen,
  GraduationCap,
  BookOpen,
  Sparkles,
  Users,
} from "lucide-react";
import { authContext, type AuthUser } from "@/features/auth/authContext";
import { PageContainer } from "@/shared/components/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn";

const quickLinks = [
  {
    to: "/departments",
    title: "Departments",
    description: "Organize faculties and programs",
    icon: Building2,
    color: "from-violet-500/20 to-violet-600/5",
  },
  {
    to: "/teachers",
    title: "Teachers",
    description: "Faculty and specializations",
    icon: Users,
    color: "from-blue-500/20 to-blue-600/5",
  },
  {
    to: "/batches",
    title: "Batches",
    description: "Student groups per semester",
    icon: GraduationCap,
    color: "from-emerald-500/20 to-emerald-600/5",
  },
  {
    to: "/subjects",
    title: "Subjects",
    description: "Courses and weekly load",
    icon: BookOpen,
    color: "from-amber-500/20 to-amber-600/5",
  },
  {
    to: "/rooms",
    title: "Rooms",
    description: "Classrooms and laboratories",
    icon: DoorOpen,
    color: "from-rose-500/20 to-rose-600/5",
  },
  {
    to: "/timeslots",
    title: "Time slots",
    description: "Periods across the week",
    icon: Clock,
    color: "from-cyan-500/20 to-cyan-600/5",
  },
  {
    to: "/timetable",
    title: "Timetable",
    description: "Generate and view schedules",
    icon: CalendarDays,
    color: "from-primary/25 to-primary/5",
    featured: true as const,
  },
];

function Home() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    void authContext.getCurrentUser().then(setCurrentUser);
  }, []);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <PageContainer
      title={`${greeting}, ${currentUser?.username ?? "there"}`}
      description="Manage academic structure and build conflict-free timetables from one place."
    >
      <Card className="mb-8 overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background/50 to-background/30">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Student Timetable Management System
            </div>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              Start by setting up departments and resources, then auto-generate timetables that respect
              teacher, room, and batch constraints.
            </p>
          </div>
          <Link
            to="/timetable"
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90"
          >
            Open timetable
          </Link>
        </CardContent>
      </Card>

      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Quick access
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {quickLinks.map((item) => {
          const { to, title, description, icon: Icon, color } = item;
          const featured = "featured" in item && item.featured;
          return (
          <Link key={to} to={to} className="group block h-full">
            <Card
              className={cn(
                "h-full border-border/60 bg-background/40 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg",
                featured && "ring-2 ring-primary/20",
              )}
            >
              <CardHeader className="pb-2">
                <div
                  className={cn(
                    "mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br",
                    color,
                  )}
                >
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg group-hover:text-primary">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Open →
                </span>
              </CardContent>
            </Card>
          </Link>
          );
        })}
      </div>

      {currentUser?.roles?.length ? (
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{currentUser.username}</span>
          {" · "}
          {currentUser.roles.join(", ")}
        </p>
      ) : null}
    </PageContainer>
  );
}

export default Home;
