import type { ReactNode } from "react";

type PageContainerProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function PageContainer({ title, description, action, children }: PageContainerProps) {
  return (
    <div className="min-h-[calc(100vh-8rem)] bg-white/30 py-8 mt-[5rem] min-w-[calc(100%-2rem)] rounded-lg shadow-xl">
      <div className="mx-[2rem]">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            {description ? <p className="mt-2 text-muted-foreground">{description}</p> : null}
          </div>
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}

export default PageContainer;
