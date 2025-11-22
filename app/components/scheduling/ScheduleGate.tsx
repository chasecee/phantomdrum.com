// Date-aware wrapper that previews both states locally
import clsx from "clsx";
import type { ReactNode } from "react";

type ScheduleGateLabels = {
  before?: string;
  after?: string;
};

type ScheduleGateProps = {
  releaseDate: Date;
  before: ReactNode;
  after: ReactNode;
  labels?: ScheduleGateLabels;
  className?: string;
  now?: Date;
};

const isDev = process.env.NODE_ENV !== "production";

export default function ScheduleGate({
  releaseDate,
  before,
  after,
  labels,
  className,
  now,
}: ScheduleGateProps) {
  const timestamp = releaseDate.getTime();
  if (Number.isNaN(timestamp)) {
    throw new Error("ScheduleGate requires a valid releaseDate");
  }

  const currentTime = now ?? new Date();
  const isReleased = currentTime.getTime() >= timestamp;

  if (!isDev) {
    return <>{isReleased ? after : before}</>;
  }

  return (
    <div className={clsx("space-y-10", className)}>
      <ScheduleGatePreview
        label={`${labels?.before ?? "Before release"} · dev preview`}
      >
        {before}
      </ScheduleGatePreview>
      <ScheduleGatePreview
        label={`${labels?.after ?? "After release"} · dev preview`}
      >
        {after}
      </ScheduleGatePreview>
    </div>
  );
}

type ScheduleGatePreviewProps = {
  label: string;
  children: ReactNode;
};

function ScheduleGatePreview({ label, children }: ScheduleGatePreviewProps) {
  return (
    <div className={clsx(isDev && "border-2 border-red-500")}>
      {label}
      <div className="contents">{children}</div>
    </div>
  );
}
